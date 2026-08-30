# Beta-Lactam Anomaly Screen / βLAS

Beta-Lactam Anomaly Screen (βLAS) is a full-stack application designed to screen *Streptococcus pyogenes* (Group A Streptococcus) isolates for reduced beta-lactam susceptibility. It leverages a pre-trained machine learning model (Isolation Forest) on the backend to analyze `pbp2x` gene sequences for structural mutations and anomalies. The user-friendly web interface allows researchers to process single or batch sequences to identify potentially resistant strains quickly and accurately.

## Dataset Source
The raw genomic data and isolates used to train the models in this project were sourced from **NCBI BioProject PRJNA817826**. Please note that the raw data files (FASTA, genomes, etc.) are not included in this repository to save space and can be fetched directly via the NCBI BioProject ID.

## Setup Instructions

1. **Install dependencies**
   Ensure you have Python 3.9+ installed. Create a virtual environment and install the required packages using:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Backend
The backend is built with FastAPI. Start the server using `uvicorn`:

```bash
cd backend
uvicorn app:app --reload --port 8000
```
*The API will be available at `http://localhost:8000`.*
*Interactive API documentation is available at `http://localhost:8000/docs`.*

### Frontend
The frontend consists of static HTML, CSS, and JavaScript files. Serve the `frontend` directory using a local web server (to avoid module loading and CORS issues).

In a new terminal window, run:
```bash
cd frontend
python -m http.server 3000
```
Navigate to `http://localhost:3000` in your web browser to access the Home, How It Works, and Analyze pages.

## Folder Structure
- `backend/`: FastAPI application (`app.py`), the Isolation Forest model, and dependencies.
- `frontend/`: Static HTML, CSS, and JavaScript files for the web interface.
- `notebooks/`: Jupyter notebooks used for data exploration and model training.
