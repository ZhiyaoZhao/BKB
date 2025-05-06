import re
from docx import Document

def extract_headings(file_path):
    """
    从 Word 文档中提取标题并组织成嵌套字典结构
    
    参数:
        file_path (str): .docx 文件的路径
    
    返回值:
        dict: 嵌套的标题字典
    """
    # 加载 Word 文档
    document = Document(file_path)
    
    # 定义正则表达式，用于匹配不同级别的标题
    patterns = {
        "H1": r"^\d+\s+(.+)$",         # 匹配一级标题，例如 "1 标题"
        "H2": r"^\d+\.\d+\s+(.+)$",    # 匹配二级标题，例如 "1.1 标题"
        "H3": r"^\d+\.\d+\.\d+\s+(.+)$" # 匹配三级标题，例如 "1.1.1 标题"
    }
    
    # 初始化用于存储标题的字典
    headings_dict = {}
    current_h1, current_h2 = None, None  # 当前处理的一级和二级标题

    # 遍历文档中的所有段落
    for paragraph in document.paragraphs:
        # 获取段落文本并去除首尾空格
        text = paragraph.text.strip()
        if not text:
            continue  # 跳过空行
        
        # 匹配段落文本是否是一级标题
        if re.match(patterns["H1"], text):
            # 提取并存储一级标题
            current_h1 = re.match(patterns["H1"], text).group(1)
            headings_dict[current_h1] = {}
        # 匹配段落文本是否是二级标题
        elif re.match(patterns["H2"], text) and current_h1:
            # 提取并存储二级标题到当前的一级标题下
            current_h2 = re.match(patterns["H2"], text).group(1)
            headings_dict[current_h1][current_h2] = {}
        # 匹配段落文本是否是三级标题
        elif re.match(patterns["H3"], text) and current_h1 and current_h2:
            # 提取并存储三级标题到当前的二级标题下
            current_h3 = re.match(patterns["H3"], text).group(1)
            headings_dict[current_h1][current_h2][current_h3] = {}

    return headings_dict


if __name__ == "__main__":
    # 指定 Word 文档的路径
    file_path = "example.docx"

    # 提取标题并将其组织成嵌套字典
    headings = extract_headings(file_path)

    # 使用 JSON 格式打印结果，支持中文显示
    import json
    print(json.dumps(headings, indent=4, ensure_ascii=False))