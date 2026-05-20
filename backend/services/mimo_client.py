import httpx
import base64
import json
from pathlib import Path
from ..config import MIMO_BASE_URL, MIMO_API_KEY, MIMO_VISION_MODEL, MIMO_TEXT_MODEL


async def chat_completion(messages: list, model: str = None, temperature: float = 0.7, max_tokens: int = 2000):
    """MiMo 文本对话"""
    model = model or MIMO_TEXT_MODEL
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{MIMO_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {MIMO_API_KEY}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def chat_completion_stream(messages: list, model: str = None, temperature: float = 0.7):
    """MiMo 流式对话"""
    model = model or MIMO_TEXT_MODEL
    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST",
            f"{MIMO_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {MIMO_API_KEY}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "temperature": temperature, "stream": True}
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    chunk = json.loads(line[6:])
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content


async def vision_completion(image_path: str, prompt: str, system_prompt: str = None):
    """MiMo 多模态图片理解"""
    path = Path(image_path)
    suffix = path.suffix.lower().lstrip(".")
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
    mime = mime_map.get(suffix, "image/jpeg")

    with open(path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_b64}"}},
            {"type": "text", "text": prompt}
        ]
    })

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{MIMO_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {MIMO_API_KEY}", "Content-Type": "application/json"},
            json={"model": MIMO_VISION_MODEL, "messages": messages, "max_tokens": 2000}
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


SYSTEM_PROMPTS = {
    "homework": "你是大学生的作业助手，擅长各学科作业解答。给出清晰的解题步骤，最后总结关键知识点。",
    "diet": "你是营养师AI，分析食物图片中的菜品，估算每道菜的热量(千卡)，给出整体营养评价和建议。",
    "schedule": "你从图片中提取课程表信息。输出JSON数组，每项包含: course_name, teacher, classroom, day_of_week(1-7), start_time, end_time。",
    "exam": "你是出题专家，根据给定学科和知识点生成高质量选择题。每题输出JSON: {question, options:[A,B,C,D], answer, explanation}。",
    "knowledge": "从对话中提取关键实体和关系。输出JSON: {entities:[{name, type, properties}], relations:[{from, to, type}]}。",
    "general": "你是MiMo Student，大学生的AI生活助手。友好、简洁、实用。"
}
