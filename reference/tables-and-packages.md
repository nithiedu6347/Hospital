# Tables and packages

Database: `postgres`  
Schema: `hospital`

Every table also has `id`, `created`, `created_by`, `modified`, `modified_by`, and `deleted`.

## Tables

### hospital.users

Login account for admin and patient.

| Column | Notes |
|---|---|
| full_name | |
| email | Unique |
| phone | Unique |
| password_hash | Stored hashed |
| role | `admin` or `patient` |
| is_active | 1 = on |
| last_login | |

### hospital.patients

Profile for a patient account. One row points at `hospital.users`.

| Column | Notes |
|---|---|
| user_id | Foreign key to `hospital.users` |
| age | |
| gender | |
| full_address | |
| city | |
| state | |
| pincode | 6 digits |
| location | |
| marital_status | |
| education | |
| occupation | |
| referred_by | |
| consent_accepted | 1 = declaration signed |
| consent_at | |

### hospital.assessments

One quiz, such as BEIS-10 or MHI-38.

| Column | Notes |
|---|---|
| code | Unique, for example `beis-10` |
| title | |
| category | |
| description | |
| duration_label | |

### hospital.questions

One question inside a quiz.

| Column | Notes |
|---|---|
| assessment_id | Foreign key to `hospital.assessments` |
| sort_order | Question number. Unique per quiz |
| prompt | English |
| prompt_ta | Tamil |
| options | JSON list of answers. Each item has `option_id`, `order`, `label`, and `score` |

Example:

```json
[
  {"option_id": 1, "order": 1, "label": "Yes", "score": 1},
  {"option_id": 2, "order": 2, "label": "No", "score": 0}
]
```

`option_id` is the value stored in `quiz_answers.option_id`. `order` is only the display position.

### hospital.quiz_attempts

One sitting of a quiz by one person. This row says whether they finished.

| Column | Notes |
|---|---|
| user_id | Foreign key to `hospital.users` |
| assessment_id | Foreign key to `hospital.assessments` |
| status | `in_progress` or `submitted` |
| submitted_at | |
| total_score | Filled when they submit |

### hospital.quiz_answers

One chosen answer. Saved as soon as the patient picks it.

| Column | Notes |
|---|---|
| attempt_id | Foreign key to `hospital.quiz_attempts` |
| question_id | Foreign key to `hospital.questions` |
| option_id | `option_id` of the chosen item inside `questions.options` |
| score | Copy of the chosen option score |

One answer per question in an attempt (`attempt_id` + `question_id` is unique).

## Python packages

File: `backend/requirements.txt`

| Package | Use |
|---|---|
| fastapi | API |
| uvicorn | Runs the API |
| psycopg[binary] | PostgreSQL |
| bcrypt | Password hashing |
| python-dotenv | Reads `backend/.env` |
| email-validator | Email checks |

## React packages

File: `frontend/package.json`

| Package | Use |
|---|---|
| react 19 | UI |
| react-dom 19 | UI |
| react-router-dom 7 | Pages |
| vite 8 | Dev server and build |
| @vitejs/plugin-react | React in Vite |
| eslint | Lint |
| eslint-plugin-react-hooks | Lint |
| eslint-plugin-react-refresh | Lint |
| @eslint/js | Lint |
| globals | Lint |
| @types/react | Types |
| @types/react-dom | Types |
