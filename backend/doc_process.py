import os
import time
from dotenv import load_dotenv
from rich import print
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from AstraDB.db_client import get_vector_store
from summary_prompt import SUMMARY_PROMPT
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY_MRVK")


def load_document(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path)
    elif ext == ".docx":
        return Docx2txtLoader(file_path)
    elif ext == ".txt":
        return TextLoader(file_path)
    else:
        raise ValueError("Unsupported file type")


def summarize_document(file_path: str) -> str:
    try:
        vector_store = get_vector_store('DocScannerPdf')
        # Load text and wrap in LangChain Document
        docs = load_document(file_path)

        # Chunk the documents
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        final_documents = splitter.split_documents(docs)

        # Add to Astra Vector DB
        vector_store.add_documents(documents=final_documents)

        # Setup Retriever and LLM Chain
        retriever = vector_store.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"k": 1, "score_threshold": 0.5},
        )

        llm = ChatGroq(
            model_name="llama-3.1-8b-instant",
            groq_api_key=groq_api_key
        )

        prompt = ChatPromptTemplate.from_template(SUMMARY_PROMPT)
        doc_chain = create_stuff_documents_chain(llm, prompt)
        retrieval_chain = create_retrieval_chain(retriever, doc_chain)

        start = time.process_time()
        response = retrieval_chain.invoke({"input": "Summarize this document"})
        print("Response time:", time.process_time() - start)

        raw_answer = response['answer'].strip()

        if not raw_answer:
            return "No valid summary could be generated."

        cleaned_answer = raw_answer[0].upper() + raw_answer[1:]
        if not cleaned_answer.endswith("."):
            cleaned_answer += "."

        return cleaned_answer

    except Exception as e:
        print("[red]Summarization error:[/red]", str(e))
        return "Failed to summarize document due to internal error."
    
    finally:
        vector_store.delete_collection()
