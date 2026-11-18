"""FileTools that refuse to write binary documents as text (port of hermes-agent's
_check_binary_document_write, External-Repos/hermes-agent/tools/file_tools_write_guards.py).

A text write can never produce a valid .docx (zip) or .pdf, and read_file of one shows garbage or
fails, so a model that "edits" one through save_file destroys it. Those files are made only by
skill scripts through run_skill_script (app/agent/skill_runner.py). Unlike hermes we refuse
.pdf always (not only on overwrite): nothing here should hand-write PDF syntax.
"""
from pathlib import Path

from agno.tools.file import FileTools

BINARY_EXTENSIONS = {
    ".docx", ".docm", ".dotx", ".doc", ".xlsx", ".xlsm", ".xls", ".pptx", ".ppt", ".odt", ".ods",
    ".odp", ".pdf", ".zip", ".gz", ".7z", ".rar", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp",
    ".ico", ".tif", ".tiff", ".db", ".sqlite", ".exe", ".dll", ".so", ".pyc",
}
_HOW = {
    ".docx": "load the microsoft-office skill: write a JSON spec with save_file, then "
             'run_skill_script("microsoft-office", "docx_create", ["spec.json", "out.docx"]) '
             "(docx_read --text / docx_edit to read or change one)",
    ".pdf": "load the pdf skill: write a JSON spec with save_file, then "
            'run_skill_script("pdf", "pdf_create", ["spec.json", "-o", "out.pdf"]) (pdf_read --text to read one)',
    ".xlsx": "load the xlsx skill (microsoft-office): write a JSON spec with save_file, then run its "
             "xlsx_create script through run_skill_script (xlsx_read to read one, xlsx_edit to change one)",
    ".pptx": "load the pptx skill (microsoft-office): write a JSON spec with save_file, then run its "
             "pptx_create script through run_skill_script (pptx_read to read one, pptx_edit to change one)",
}


def binary_write_error(file_name: str) -> str | None:
    ext = Path(str(file_name)).suffix.lower()
    if ext not in BINARY_EXTENSIONS:
        return None
    how = _HOW.get(ext, "use the matching skill's scripts through run_skill_script")
    return (f"Error: refusing to write text to binary file '{file_name}' ({ext}); a text write "
            f"would corrupt it. Instead, {how}.")


def binary_read_error(file_name: str) -> str | None:
    ext = Path(str(file_name)).suffix.lower()
    if ext == ".docx":
        return ("Error: .docx is binary; read it with "
                f'run_skill_script("microsoft-office", "docx_read", ["--text", "{file_name}"]).')
    if ext == ".pdf":
        return f'Error: .pdf is binary; read it with run_skill_script("pdf", "pdf_read", ["--text", "{file_name}"]).'
    if ext == ".xlsx":
        return ("Error: .xlsx is binary; read it with "
                f'run_skill_script("microsoft-office", "xlsx_read", ["{file_name}"]).')
    if ext == ".pptx":
        return ("Error: .pptx is binary; read it with "
                f'run_skill_script("microsoft-office", "pptx_read", ["{file_name}"]).')
    if ext in BINARY_EXTENSIONS:
        return f"Error: '{file_name}' is a binary file and cannot be read as text."
    return None


class WorkspaceFileTools(FileTools):
    """agno FileTools + the binary-document guard (replace_file_chunk writes via save_file)."""

    def save_file(self, contents: str, file_name: str, overwrite: bool = True, encoding: str = "utf-8") -> str:
        """Saves the contents to a text file called `file_name` and returns the file name if successful.
        Never use it for .docx / .pdf / .xlsx / .pptx (binary): those are made by skill scripts via run_skill_script.

        :param contents: The contents to save.
        :param file_name: The name of the file to save to.
        :param overwrite: Overwrite the file if it already exists.
        :return: The file name if successful, otherwise returns an error message.
        """
        return binary_write_error(file_name) or super().save_file(contents, file_name, overwrite, encoding)

    def read_file(self, file_name: str, encoding: str = "utf-8") -> str:
        """Reads the contents of the text file `file_name` and returns the contents if successful.
        For .docx / .pdf / .xlsx / .pptx use the skill read scripts via run_skill_script.

        :param file_name: The name of the file to read.
        :param encoding: Encoding to use, default - utf-8
        :return: The contents of the file if successful, otherwise returns an error message.
        """
        return binary_read_error(file_name) or super().read_file(file_name, encoding)
