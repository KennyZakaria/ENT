# Use Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 2001

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "2001"]
