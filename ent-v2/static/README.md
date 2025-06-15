# File Upload Testing Frontend

This is a simple frontend for testing the file upload functionality of the microservice.

## How to Use

1. Start the FastAPI server by running:
   ```
   python -m app.main
   ```

2. Open your browser and navigate to `http://localhost:8000`

3. You'll see a form with the following fields:
   - Authentication Token (JWT) - Optional for testing
   - Course Title
   - Course Description
   - File Upload

4. Fill in the form and upload a file (allowed types: pdf, doc, docx, ppt, pptx, txt)

5. Click the "Upload" button to submit the form

6. The response from the server will be displayed below the form

## Notes

- For testing purposes, authentication has been made optional
- Maximum file size is 10MB
- The uploaded files are stored in MinIO and metadata in Cassandra