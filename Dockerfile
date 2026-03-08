FROM python:3.10

WORKDIR /code

COPY ./backend/requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./ /code/backend/

# Set the working directory to where main.py is
WORKDIR /code/backend

# Run the FastAPI server on the huggingface default port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
