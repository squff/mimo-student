import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from ..config import UPLOAD_DIR
from ..models import get_db
from ..services.mimo_client import (
    chat_completion, chat_completion_stream, vision_completion, SYSTEM_PROMPTS
)

router = APIRouter()


# ===== 通用对话 =====
class ChatRequest(BaseModel):
    message: str
    module: str = "general"
    history: list = []

@router.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(req.module, SYSTEM_PROMPTS["general"])}]
    messages.extend(req.history[-10:])
    messages.append({"role": "user", "content": req.message})

    db = await get_db()
    try:
        response = await chat_completion(messages)
        await db.execute(
            "INSERT INTO interactions (module, user_input, ai_response) VALUES (?, ?, ?)",
            (req.module, req.message, response)
        )
        await db.commit()
    finally:
        await db.close()
    return {"response": response, "module": req.module}


@router.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(req.module, SYSTEM_PROMPTS["general"])}]
    messages.extend(req.history[-10:])
    messages.append({"role": "user", "content": req.message})

    async def generate():
        full = []
        async for chunk in chat_completion_stream(messages):
            full.append(chunk)
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
        # 保存完整回复
        db = await get_db()
        try:
            await db.execute(
                "INSERT INTO interactions (module, user_input, ai_response) VALUES (?, ?, ?)",
                (req.module, req.message, "".join(full))
            )
            await db.commit()
        finally:
            await db.close()
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ===== 拍照识别 (通用) =====
@router.post("/api/vision")
async def vision_analyze(image: UploadFile = File(...), prompt: str = Form(""), module: str = Form("general")):
    file_id = f"{uuid.uuid4().hex}.jpg"
    file_path = UPLOAD_DIR / file_id
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    system_prompt = SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS["general"])
    final_prompt = prompt or "请分析这张图片中的内容，给出详细的描述和建议。"

    result = await vision_completion(str(file_path), final_prompt, system_prompt)

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO interactions (module, user_input, image_path, ai_response) VALUES (?, ?, ?, ?)",
            (module, final_prompt, str(file_path), result)
        )
        await db.commit()
    finally:
        await db.close()
    return {"response": result, "image": file_id, "module": module}


# ===== 作业管理 =====
@router.get("/api/homework")
async def list_homework():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM homework ORDER BY deadline ASC")
        rows = await cursor.fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        await db.close()

class HomeworkCreate(BaseModel):
    subject: str
    title: str
    description: str = ""
    deadline: str = ""

@router.post("/api/homework")
async def create_homework(req: HomeworkCreate):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO homework (subject, title, description, deadline) VALUES (?, ?, ?, ?)",
            (req.subject, req.title, req.description, req.deadline)
        )
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()

@router.put("/api/homework/{hw_id}")
async def update_homework(hw_id: int, status: str = Form(...)):
    db = await get_db()
    try:
        await db.execute("UPDATE homework SET status = ? WHERE id = ?", (status, hw_id))
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()

@router.delete("/api/homework/{hw_id}")
async def delete_homework(hw_id: int):
    db = await get_db()
    try:
        await db.execute("DELETE FROM homework WHERE id = ?", (hw_id,))
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()


# ===== 课程表 =====
@router.get("/api/schedule")
async def get_schedule():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM schedule ORDER BY day_of_week, start_time")
        rows = await cursor.fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        await db.close()

class ScheduleCreate(BaseModel):
    course_name: str
    teacher: str = ""
    classroom: str = ""
    day_of_week: int = 1
    start_time: str = "08:00"
    end_time: str = "09:40"
    color: str = "#3b82f6"

@router.post("/api/schedule")
async def create_schedule(req: ScheduleCreate):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO schedule (course_name, teacher, classroom, day_of_week, start_time, end_time, color) VALUES (?,?,?,?,?,?,?)",
            (req.course_name, req.teacher, req.classroom, req.day_of_week, req.start_time, req.end_time, req.color)
        )
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()

@router.post("/api/schedule/ocr")
async def schedule_ocr(image: UploadFile = File(...)):
    """拍课表照片 → 自动提取课程"""
    file_id = f"{uuid.uuid4().hex}.jpg"
    file_path = UPLOAD_DIR / file_id
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    result = await vision_completion(
        str(file_path),
        "请从这张课程表图片中提取所有课程信息。输出严格的JSON数组，每项包含: course_name(课程名), teacher(教师), classroom(教室), day_of_week(星期几,1=周一到7=周日), start_time(开始时间HH:MM), end_time(结束时间HH:MM)。只输出JSON，不要其他文字。",
        "你是课程表OCR助手，从图片中精确提取课程信息，输出标准JSON。"
    )

    # 尝试解析JSON并保存
    courses = []
    try:
        # 提取JSON部分
        text = result.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        courses = json.loads(text)
        db = await get_db()
        try:
            for c in courses:
                await db.execute(
                    "INSERT INTO schedule (course_name, teacher, classroom, day_of_week, start_time, end_time) VALUES (?,?,?,?,?,?)",
                    (c.get("course_name",""), c.get("teacher",""), c.get("classroom",""),
                     c.get("day_of_week",1), c.get("start_time","08:00"), c.get("end_time","09:40"))
                )
            await db.commit()
        finally:
            await db.close()
    except:
        pass

    return {"response": result, "courses": courses, "image": file_id}

@router.delete("/api/schedule/{sch_id}")
async def delete_schedule(sch_id: int):
    db = await get_db()
    try:
        await db.execute("DELETE FROM schedule WHERE id = ?", (sch_id,))
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()


# ===== 饮食记录 =====
@router.get("/api/diet")
async def list_diet(days: int = 7):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM diet_records WHERE created_at > datetime('now', ?) ORDER BY created_at DESC",
            (f"-{days} days",)
        )
        rows = await cursor.fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        await db.close()

@router.post("/api/diet/analyze")
async def diet_analyze(image: UploadFile = File(...), meal_type: str = Form("午餐")):
    """拍餐盘 → 识别菜品+估热量"""
    file_id = f"{uuid.uuid4().hex}.jpg"
    file_path = UPLOAD_DIR / file_id
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    result = await vision_completion(
        str(file_path),
        f"这是{meal_type}。请识别图片中的每道菜品，估算每道菜的热量(千卡)，计算总热量，并给出营养评价。输出JSON格式: {{foods:[{{name, calories}}], total_calories, evaluation, suggestions}}",
        SYSTEM_PROMPTS["diet"]
    )

    # 保存记录
    total_cal = 0
    foods_str = result
    try:
        text = result.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(text)
        total_cal = data.get("total_calories", 0)
        foods_str = json.dumps(data.get("foods", []), ensure_ascii=False)
    except:
        pass

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO diet_records (meal_type, foods, calories, image_path) VALUES (?,?,?,?)",
            (meal_type, foods_str, total_cal, str(file_path))
        )
        await db.commit()
    finally:
        await db.close()

    return {"response": result, "image": file_id}


@router.get("/api/diet/stats")
async def diet_stats(days: int = 7):
    """营养周报"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT date(created_at) as day, SUM(calories) as total FROM diet_records WHERE created_at > datetime('now', ?) GROUP BY date(created_at) ORDER BY day",
            (f"-{days} days",)
        )
        rows = await cursor.fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        await db.close()


# ===== 考试冲刺 =====
@router.post("/api/exam/generate")
async def generate_exam(subject: str = Form(...), count: int = Form(5)):
    """生成模拟题"""
    response = await chat_completion([
        {"role": "system", "content": SYSTEM_PROMPTS["exam"]},
        {"role": "user", "content": f"请生成{count}道关于「{subject}」的选择题，难度中等偏上。输出JSON数组。"}
    ])

    cards = []
    try:
        text = response.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        cards = json.loads(text)
        db = await get_db()
        try:
            for c in cards:
                q_text = c.get("question", "")
                answer = c.get("answer", "")
                options = c.get("options", [])
                explanation = c.get("explanation", "")
                full_q = f"{q_text}\n" + "\n".join(options) if options else q_text
                await db.execute(
                    "INSERT INTO exam_cards (subject, question, answer, explanation) VALUES (?,?,?,?)",
                    (subject, full_q, answer, explanation)
                )
            await db.commit()
        finally:
            await db.close()
    except:
        pass

    return {"response": response, "cards": cards}


@router.get("/api/exam/cards")
async def list_exam_cards(subject: Optional[str] = None, mastered: Optional[int] = None):
    db = await get_db()
    try:
        query = "SELECT * FROM exam_cards WHERE 1=1"
        params = []
        if subject:
            query += " AND subject = ?"
            params.append(subject)
        if mastered is not None:
            query += " AND mastered = ?"
            params.append(mastered)
        query += " ORDER BY created_at DESC"
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        await db.close()

@router.put("/api/exam/cards/{card_id}/master")
async def mark_mastered(card_id: int, mastered: int = 1):
    db = await get_db()
    try:
        await db.execute("UPDATE exam_cards SET mastered = ? WHERE id = ?", (mastered, card_id))
        await db.commit()
        return {"status": "ok"}
    finally:
        await db.close()


# ===== 统计 =====
@router.get("/api/stats")
async def get_stats():
    db = await get_db()
    try:
        stats = {}
        for table in ["interactions", "homework", "schedule", "diet_records", "exam_cards"]:
            cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
            row = await cursor.fetchone()
            stats[table] = row[0]
        # 今日互动
        cursor = await db.execute("SELECT COUNT(*) FROM interactions WHERE date(created_at) = date('now')")
        stats["today_interactions"] = (await cursor.fetchone())[0]
        # 未掌握题目
        cursor = await db.execute("SELECT COUNT(*) FROM exam_cards WHERE mastered = 0")
        stats["unmastered_cards"] = (await cursor.fetchone())[0]
        return stats
    finally:
        await db.close()
