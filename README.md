# 💰 AI Personal Finance Manager

An intelligent personal finance management application that helps users track expenses, manage income, analyze spending habits, and predict future financial trends using Artificial Intelligence and Machine Learning.

The goal of this project is to make personal financial management smarter, easier, and more accessible through data analytics and AI-powered insights.

## 🚀 Key Features

- **Expense Tracking:** Record and manage daily expenses.
- **Income Management:** Track multiple income sources.
- **Smart Categorization:** Automatically categorize transactions.
- **AI-Powered Insights:** Analyze spending patterns and identify unnecessary expenses.
- **Expense Prediction:** Predict future monthly expenses using Machine Learning.
- **Budget Management:** Set monthly budgets and monitor spending.
- **Financial Dashboard:** Visualize income, expenses, savings, and spending trends.
- **Monthly Reports:** Generate detailed financial summaries.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend development |
| FastAPI | REST API development |
| PostgreSQL / MySQL | Database management |
| Pandas & NumPy | Data processing |
| Scikit-learn | Machine Learning |
| React.js | Frontend development |
| HTML & CSS | UI development |
| Chart.js | Data visualization |
| Git & GitHub | Version control |

## 🏗️ Project Architecture

```text
AI-Personal-Finance-Manager/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── routes/
│   │   ├── expenses.py
│   │   ├── income.py
│   │   └── analytics.py
│   │
│   ├── services/
│   │   ├── categorization.py
│   │   └── prediction.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── ml_models/
│   ├── expense_prediction.py
│   └── expense_classifier.py
│
├── screenshots/
│
├── .env.example
├── .gitignore
└── README.md
```

## 🧠 How It Works

1. Users register and log in to their accounts.
2. Users enter their income and daily expenses.
3. The application stores transaction data in the database.
4. Machine Learning models analyze transaction patterns.
5. The system categorizes expenses and generates financial insights.
6. Users receive spending predictions and budget recommendations.
7. An interactive dashboard displays financial performance.

## 📊 Machine Learning Implementation

The project incorporates Machine Learning for two major functionalities:

**1. Expense Categorization**

- Analyzes transaction descriptions and amounts.
- Classifies expenses into categories such as Food, Travel, Shopping, Bills, and Entertainment.
- Uses text-processing and classification techniques.

**2. Expense Prediction**

- Analyzes historical spending patterns.
- Predicts upcoming monthly expenses.
- Helps users plan budgets and control spending.

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js
- PostgreSQL or MySQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/AI-Personal-Finance-Manager.git

cd AI-Personal-Finance-Manager
```

### 2. Set Up Python Environment

```bash
python -m venv venv
```

Activate the environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file using `.env.example` as a template.

Add your database credentials and other required configuration.

Never upload your actual `.env` file to GitHub.

### 5. Start the Backend

```bash
uvicorn backend.main:app --reload
```

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔮 Future Improvements

- AI-powered financial chatbot.
- Bank transaction integration.
- Advanced spending anomaly detection.
- Investment tracking and portfolio analysis.
- Financial goal planning.
- Mobile application.
- Personalized saving recommendations.

## 🔐 Security

- Secure password hashing.
- Authentication and authorization.
- Environment-based configuration.
- Input validation.
- Protected financial records.

**Note:** This project is intended for educational purposes and is not a substitute for professional financial advice.

## 👨‍💻 Author

**Vishal Kumar**

B.Tech Graduate | Artificial Intelligence & Machine Learning

- GitHub: [@krvishal23](https://github.com/krvishal23)
- LinkedIn: Add your LinkedIn profile URL

## ⭐ Support

If you find this project interesting, consider giving it a ⭐ on GitHub!

---

*Built with Python, Machine Learning, and a passion for solving real-world problems.*
