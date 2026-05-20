#!/usr/bin/env python3
"""MiMo Student - 种子数据脚本"""
import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "mimo_student.db")

SCHEDULE = [
    ("高等数学A", "张明教授", "教学楼A-301", 1, "08:00", "09:40", "#ef4444"),
    ("大学英语(三)", "李华副教授", "外语楼B-205", 1, "10:00", "11:40", "#3b82f6"),
    ("数据结构与算法", "王强教授", "计算机楼C-101", 2, "08:00", "09:40", "#10b981"),
    ("线性代数", "赵丽教授", "教学楼A-405", 2, "14:00", "15:40", "#f59e0b"),
    ("操作系统原理", "陈伟副教授", "计算机楼C-203", 3, "08:00", "09:40", "#8b5cf6"),
    ("Python程序设计", "刘芳讲师", "机房D-101", 3, "10:00", "11:40", "#06b6d4"),
    ("概率论与数理统计", "张明教授", "教学楼A-301", 4, "08:00", "09:40", "#ec4899"),
    ("体育(篮球)", "孙健老师", "体育馆", 4, "14:00", "15:40", "#84cc16"),
]

HOMEWORK = [
    ("高等数学A", "第七章不定积分习题", "完成教材P156-P158的全部习题，注意换元法和分部积分法的应用", "2026-05-22 23:59", "pending"),
    ("数据结构与算法", "二叉树遍历编程实验", "实现二叉树的前序、中序、后序遍历的递归和非递归算法，提交代码和实验报告", "2026-05-23 23:59", "pending"),
    ("大学英语(三)", "Unit 7 课文翻译与写作", "翻译课文第三段，并写一篇不少于300词的议论文，主题：Technology and Education", "2026-05-24 23:59", "pending"),
    ("线性代数", "矩阵特征值计算", "求解给定矩阵的特征值和特征向量，并验证特征值分解定理", "2026-05-21 23:59", "completed"),
    ("操作系统原理", "进程调度模拟实验", "用Python模拟FCFS、SJF和RR三种进程调度算法，对比平均等待时间", "2026-05-25 23:59", "pending"),
    ("Python程序设计", "爬虫实战项目", "编写一个简单的网页爬虫，抓取豆瓣电影Top250的数据并保存为CSV文件", "2026-05-26 23:59", "pending"),
]

EXAM_CARDS = [
    ("高等数学A", "什么是罗尔定理？", "若函数f(x)在闭区间[a,b]上连续，在开区间(a,b)上可导，且f(a)=f(b)，则至少存在一点ξ∈(a,b)，使得f'(ξ)=0。",
     "罗尔定理是微分学基本定理之一，是拉格朗日中值定理的特殊情况。几何意义是：满足条件的曲线上至少有一点的切线平行于x轴。", 3, 1),
    ("数据结构与算法", "解释快速排序的平均时间复杂度及原理", "快速排序的平均时间复杂度为O(nlogn)。通过选择基准元素，将数组分为小于和大于基准的两部分，递归排序。",
     "快速排序采用分治策略，虽然最坏情况为O(n²)，但通过随机化选择基准可以大概率避免最坏情况。空间复杂度为O(logn)（递归栈）。", 4, 0),
    ("操作系统原理", "什么是死锁？产生死锁的四个必要条件是什么？", "死锁是指两个或多个进程互相等待对方持有的资源而无法继续执行的情况。四个必要条件：互斥条件、请求与保持条件、不可剥夺条件、循环等待条件。",
     "预防死锁的方法是破坏四个条件之一。银行家算法可以避免死锁，通过检查系统是否处于安全状态来决定是否分配资源。", 4, 0),
    ("线性代数", "矩阵可逆的充要条件是什么？", "n阶方阵A可逆的充要条件是：|A|≠0（行列式不为零），即A为非奇异矩阵。等价条件包括：A的秩为n、A的行(列)向量线性无关、A的特征值全不为零。",
     "可逆矩阵的逆矩阵可以通过伴随矩阵法A*=|A|⁻¹·adj(A)或初等行变换法[A|E]→[E|A⁻¹]求得。", 3, 1),
    ("Python程序设计", "Python中列表和元组有什么区别？", "列表(list)是可变的，用[]表示；元组(tuple)是不可变的，用()表示。列表可以增删改元素，元组创建后不能修改。元组因为不可变所以可以作为字典的键，列表不行。",
     "在性能上，元组比列表更节省内存，访问速度也更快。当数据不需要修改时，推荐使用元组。", 2, 1),
    ("概率论与数理统计", "什么是大数定律？", "大数定律描述了当试验次数n趋于无穷时，事件发生的频率依概率收敛于该事件的概率。切比雪夫大数定律：若Xi独立同分布且E(Xi)=μ，则样本均值依概率收敛于μ。",
     "大数定律是概率论与数理统计的理论基础，保证了用频率估计概率、用样本均值估计总体均值的合理性。", 3, 0),
    ("高等数学A", "定积分的几何意义是什么？", "定积分∫[a,b]f(x)dx的几何意义是由曲线y=f(x)、直线x=a、x=b和x轴所围成的曲边梯形的面积（x轴上方为正，下方为负）。",
     "定积分的本质是黎曼和的极限。牛顿-莱布尼兹公式将定积分与不定积分联系起来：∫[a,b]f(x)dx = F(b)-F(a)。", 2, 1),
    ("数据结构与算法", "比较B树和B+树的区别", "B树所有节点都存储数据；B+树只有叶子节点存储数据，且叶子节点通过链表相连。B+树的非叶子节点只存储索引信息，因此每个节点能容纳更多键值，树更矮，磁盘IO更少。",
     "B+树更适合数据库索引和文件系统，因为：1)范围查询只需遍历叶子节点链表；2)查询性能稳定（所有查询都到叶子节点）；3)更高的扇出比减少IO次数。", 4, 0),
]

INTERACTIONS = [
    ("homework_help", "帮我解这道不定积分：∫(x²+1)/(x⁴+1)dx",
     "这道题可以通过将分子分母同除以x²来简化。令t=x-1/x，则dt=(1+1/x²)dx。原式化为∫1/(t²+2)dt，这是一个标准的反正切积分形式。最终结果为(1/√2)arctan((x²-1)/(√2·x))+C。建议你回顾一下有理函数积分的常用技巧。"),
    ("homework_help", "什么是虚拟内存？和物理内存有什么区别？",
     "虚拟内存是操作系统提供的一种内存管理技术，它让每个进程认为自己拥有连续的、足够大的内存空间。物理内存是实际的RAM硬件。虚拟内存通过页表将虚拟地址映射到物理地址，当物理内存不足时，会将不常用的页面交换到磁盘（页面置换）。这样既提高了内存利用率，又实现了进程间的内存隔离。"),
    ("exam_review", "请帮我复习线性代数中矩阵的秩的相关概念",
     "矩阵的秩是矩阵中线性无关的行（或列）向量的最大数目。求秩的方法是将矩阵通过初等行变换化为行阶梯形矩阵，非零行的个数即为秩。重要性质：r(A)≤min(m,n)；r(AB)≤min(r(A),r(B))；r(A+B)≤r(A)+r(B)。秩在判断线性方程组解的情况中非常关键：r(A)=r(A|b)=n有唯一解，r(A)=r(A|b)<n有无穷多解，r(A)<r(A|b)无解。"),
    ("concept_explain", "用通俗易懂的方式解释TCP三次握手",
     "想象你在打电话给朋友：第一次握手（SYN）：你拨通电话说'喂，听得到吗？'；第二次握手（SYN+ACK）：朋友回答'听到了，你能听到我吗？'；第三次握手（ACK）：你说'我也听到了，咱们开始聊吧'。三次握手的目的是确认双方都能发送和接收数据，防止已失效的连接请求到达服务器造成资源浪费。"),
    ("homework_help", "Python中如何实现一个简单的装饰器？",
     "装饰器本质上是一个接收函数作为参数并返回新函数的高阶函数。基本写法：\n\ndef timer(func):\n    def wrapper(*args, **kwargs):\n        import time\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f'耗时: {time.time()-start:.2f}秒')\n        return result\n    return wrapper\n\n使用@语法糖：\n@timer\ndef my_func():\n    ...\n\n这样my_func()执行时会自动计时。"),
    ("concept_explain", "解释进程和线程的区别",
     "进程是资源分配的基本单位，线程是CPU调度的基本单位。一个进程可以包含多个线程。打个比方：进程就像一个工厂，线程就像工厂里的工人。每个工厂（进程）有自己的厂房和设备（内存空间），但工人们（线程）共享这些资源。创建线程比创建进程快得多，因为线程不需要独立的内存空间。但线程间的数据共享需要注意同步问题（锁、信号量等）。"),
    ("homework_help", "概率论中全概率公式和贝叶斯公式的关系是什么？",
     "全概率公式：P(B)=ΣP(Ai)P(B|Ai)，用于'由因求果'——已知各种原因的概率，求结果发生的总概率。贝叶斯公式：P(Ai|B)=P(Ai)P(B|Ai)/P(B)，用于'由果溯因'——已知结果发生了，反推是由某个原因造成的概率。两者的核心联系是：贝叶斯公式的分母就是全概率公式的结果。贝叶斯公式是机器学习、医学诊断等领域的重要工具。"),
    ("concept_explain", "什么是递归？什么时候用递归比较合适？",
     "递归就是函数调用自身。递归需要两个要素：1)基本情况（终止条件）；2)递归关系（将问题分解为更小的子问题）。适合用递归的场景：树的遍历、分治算法（归并排序、快速排序）、数学定义本身就是递归的（斐波那契数列、阶乘）。不适合递归的场景：递归层数太深会导致栈溢出；有些问题用迭代更高效（如斐波那契数列用动态规划更好）。"),
    ("homework_help", "帮我分析这段代码的时间复杂度：for i in range(n): for j in range(i): print(i,j)",
     "外层循环i从0到n-1，内层循环j从0到i-1。总执行次数=0+1+2+...+(n-1)=n(n-1)/2。所以时间复杂度为O(n²)。这是嵌套循环的经典模式，关键在于内层循环的上界依赖于外层变量，需要用求和公式计算总次数。记住：1+2+...+n=n(n+1)/2，这是分析嵌套循环复杂度的常用技巧。"),
    ("exam_review", "操作系统中的页面置换算法有哪些？各自的特点是什么？",
     "主要页面置换算法：1)FIFO（先进先出）：淘汰最早进入的页面，简单但可能产生Belady异常；2)LRU（最近最久未使用）：淘汰最长时间未被访问的页面，性能好但实现开销大；3)LFU（最不经常使用）：淘汰访问频率最低的页面；4)OPT（最优算法）：淘汰将来最长时间不会被访问的页面，理论最优但无法实现，用作比较基准。实际系统多使用Clock算法（LRU的近似实现）。"),
]

DIET_RECORDS = [
    ("breakfast", json.dumps(["豆浆", "肉包子", "鸡蛋"]), 450, "2026-05-20 07:30:00"),
    ("lunch", json.dumps(["米饭", "红烧肉", "青菜", "紫菜蛋花汤"]), 780, "2026-05-20 12:00:00"),
    ("dinner", json.dumps(["面条", "凉拌黄瓜", "酸奶"]), 520, "2026-05-20 18:30:00"),
    ("breakfast", json.dumps(["牛奶", "全麦面包", "水果沙拉"]), 380, "2026-05-19 07:45:00"),
    ("lunch", json.dumps(["炒饭", "番茄蛋汤", "水果"]), 650, "2026-05-19 12:15:00"),
    ("dinner", json.dumps(["麻辣烫", "米饭"]), 690, "2026-05-19 18:00:00"),
]


SCHEMA = """
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    user_input TEXT,
    image_path TEXT,
    ai_response TEXT,
    extracted_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    teacher TEXT,
    classroom TEXT,
    day_of_week INTEGER,
    start_time TEXT,
    end_time TEXT,
    color TEXT DEFAULT '#3b82f6'
);
CREATE TABLE IF NOT EXISTS diet_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT,
    foods TEXT,
    calories INTEGER,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    question TEXT,
    answer TEXT,
    explanation TEXT,
    difficulty INTEGER DEFAULT 3,
    mastered INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT,
    entity_name TEXT,
    properties TEXT,
    source_interaction_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def seed():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 创建表
    cur.executescript(SCHEMA)

    # 清空已有数据
    for table in ["interactions", "homework", "schedule", "diet_records", "exam_cards", "knowledge_entities"]:
        cur.execute(f"DELETE FROM {table}")

    # 插入课程表
    for row in SCHEDULE:
        cur.execute("INSERT INTO schedule (course_name, teacher, classroom, day_of_week, start_time, end_time, color) VALUES (?, ?, ?, ?, ?, ?, ?)", row)

    # 插入作业
    for row in HOMEWORK:
        cur.execute("INSERT INTO homework (subject, title, description, deadline, status) VALUES (?, ?, ?, ?, ?)", row)

    # 插入考试闪卡
    for row in EXAM_CARDS:
        cur.execute("INSERT INTO exam_cards (subject, question, answer, explanation, difficulty, mastered) VALUES (?, ?, ?, ?, ?, ?)", row)

    # 插入互动记录
    base_time = datetime(2026, 5, 20, 8, 0, 0)
    for i, (module, user_input, ai_response) in enumerate(INTERACTIONS):
        ts = (base_time - timedelta(hours=i * 3)).strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("INSERT INTO interactions (module, user_input, ai_response, created_at) VALUES (?, ?, ?, ?)",
                    (module, user_input, ai_response, ts))

    # 插入饮食记录
    for row in DIET_RECORDS:
        cur.execute("INSERT INTO diet_records (meal_type, foods, calories, created_at) VALUES (?, ?, ?, ?)", row)

    # 插入知识实体
    entities = [
        ("concept", "快速排序", json.dumps({"algorithm": "分治", "avg_complexity": "O(nlogn)", "best_for": "大规模数据排序"}), 2),
        ("concept", "虚拟内存", json.dumps({"purpose": "内存管理", "technique": "页面置换", "benefit": "进程隔离"}), 2),
        ("concept", "TCP三次握手", json.dumps({"protocol": "TCP", "steps": 3, "purpose": "可靠连接建立"}), 4),
        ("concept", "递归", json.dumps({"definition": "函数调用自身", "needs": "基本情况+递归关系", "risk": "栈溢出"}), 8),
        ("formula", "全概率公式", json.dumps({"formula": "P(B)=ΣP(Ai)P(B|Ai)", "field": "概率论", "related": "贝叶斯公式"}), 7),
    ]
    for entity_type, entity_name, properties, source_id in entities:
        cur.execute("INSERT INTO knowledge_entities (entity_type, entity_name, properties, source_interaction_id) VALUES (?, ?, ?, ?)",
                    (entity_type, entity_name, properties, source_id))

    conn.commit()
    conn.close()
    print(f"MiMo Student 种子数据插入完成！数据库: {DB_PATH}")
    print(f"  - 插入 {len(SCHEDULE)} 条课程记录")
    print(f"  - 插入 {len(HOMEWORK)} 条作业记录")
    print(f"  - 插入 {len(EXAM_CARDS)} 条考试闪卡")
    print(f"  - 插入 {len(INTERACTIONS)} 条互动记录")
    print(f"  - 插入 {len(DIET_RECORDS)} 条饮食记录")
    print(f"  - 插入 {len(entities)} 条知识实体")


if __name__ == "__main__":
    seed()
