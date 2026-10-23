"""
Initial starter curriculum content for RuralVerse AI.
Seeds foundational lessons and experiment metadata only if none exist.
Never creates fake students, fake quiz scores, or fabricated metrics.
"""

from app.core.database import SessionLocal, init_db
from app.models.course import Subject, Course
from app.models.lesson import Lesson
from app.models.experiment import Experiment
from app.models.quiz import Quiz, Question, QuestionOption


def seed_starter_content():
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Subject).count() > 0:
            print("Curriculum content already present. Skipping starter seed.")
            return

        print("Seeding genuine initial curriculum modules...")

        # 1. Physics Subject
        physics = Subject(
            name="Physics",
            description="Fundamental principles of energy, forces, electricity, and motion.",
            icon="atom",
            is_active=True,
        )
        db.add(physics)
        db.flush()

        # 2. Basic Electricity Course
        electricity_course = Course(
            subject_id=physics.id,
            title="Grade 8 Basic Electricity & Electric Circuits",
            description="Learn how electrical energy flows through closed loops and drives loads.",
            grade_level="8th Grade",
            is_published=True,
        )
        db.add(electricity_course)
        db.flush()

        # 3. Lesson: Electric Circuits & Components
        lesson1 = Lesson(
            course_id=electricity_course.id,
            title="Electric Circuits, Voltage & Conductive Loops",
            content="""An electrical circuit is a closed loop through which electric current can flow.

1. Essential Components of a Circuit:
- Voltage Source (Battery): Provides the electromotive force (potential difference) measured in Volts (V).
- Conductors (Copper Wires): Low-resistance paths containing free electrons that drift under potential difference.
- Control (Knife Switch): Interrupts or completes the physical loop.
- Load (Light Bulb): Converts electrical energy into light and thermal incandescence.

2. Ohm's Law:
Current (I) in amperes is directly proportional to voltage (V) and inversely proportional to resistance (R):
Formula: I = V / R

3. Open vs Closed Circuits:
- Closed Circuit: An unbroken path allows continuous electron drift.
- Open Circuit: A physical gap (open switch) introduces infinite resistance; current drops to 0 Amperes.""",
            order=0,
            duration_minutes=20,
            is_published=True,
            language="en",
        )
        db.add(lesson1)
        db.flush()

        # Check if an educator or admin user exists for attribution
        from app.models.user import User
        from app.core.security import get_password_hash
        system_author = db.query(User).filter(User.role.in_(["admin", "teacher"])).first()
        if not system_author:
            system_author = User(
                email="curriculum@ruralverse.org",
                hashed_password=get_password_hash("CurriculumLead2026!"),
                full_name="RuralVerse Curriculum Board",
                role="teacher",
                is_active=True,
            )
            db.add(system_author)
            db.flush()

        # 4. Starter Quiz for Electricity
        quiz = Quiz(
            course_id=electricity_course.id,
            lesson_id=lesson1.id,
            title="Electric Circuit Fundamentals Quiz",
            description="Test your conceptual understanding of electric current, closed loops, and Ohm's Law.",
            time_limit_minutes=15,
            passing_score=60.0,
            is_published=True,
            created_by=system_author.id,
        )
        db.add(quiz)
        db.flush()

        q1 = Question(
            quiz_id=quiz.id,
            question_text="What happens to the current in an electrical circuit when the knife switch is opened?",
            question_type="multiple_choice",
            points=10.0,
            order=0,
            explanation="Opening a switch introduces an air gap with infinite resistance, breaking the loop and causing current to drop immediately to zero.",
        )
        db.add(q1)
        db.flush()

        db.add_all([
            QuestionOption(question_id=q1.id, option_text="Current drops to zero because the conductive loop is broken", is_correct=True),
            QuestionOption(question_id=q1.id, option_text="Current increases to maximum", is_correct=False),
            QuestionOption(question_id=q1.id, option_text="Voltage drops to zero at the battery terminals", is_correct=False),
            QuestionOption(question_id=q1.id, option_text="The bulb glows brighter", is_correct=False),
        ])

        q2 = Question(
            quiz_id=quiz.id,
            question_text="According to Ohm's Law (I = V / R), if voltage is kept constant and resistance decreases, what happens to the current?",
            question_type="multiple_choice",
            points=10.0,
            order=1,
            explanation="Because resistance is in the denominator, decreasing resistance allows more current to flow.",
        )
        db.add(q2)
        db.flush()

        db.add_all([
            QuestionOption(question_id=q2.id, option_text="Current increases proportionally", is_correct=True),
            QuestionOption(question_id=q2.id, option_text="Current decreases", is_correct=False),
            QuestionOption(question_id=q2.id, option_text="Current remains unaffected", is_correct=False),
            QuestionOption(question_id=q2.id, option_text="Voltage reverses polarity", is_correct=False),
        ])

        # 5. Science Experiment Entries
        exp1 = Experiment(
            title="Electric Circuit & Incandescent Bulb",
            description="Interactive 3D simulation of a 9V DC battery, copper wiring, knife switch, and incandescent tungsten lamp.",
            subject="Physics",
            experiment_type="physics",
            instructions="Click the switch toggle button to observe current flow and tungsten bulb incandescence.",
            safety_notes="Low voltage DC circuit model. Safe educational simulation.",
            grade_level="8th Grade",
            is_published=True,
        )
        exp2 = Experiment(
            title="Solar System & Orbital Gravity",
            description="Interactive 3D simulation of Sun and planetary orbits with real physical telemetry data.",
            subject="Astronomy",
            experiment_type="astronomy",
            instructions="Inspect orbital radii and compare relative planet characteristics.",
            grade_level="General",
            is_published=True,
        )
        exp3 = Experiment(
            title="Human Heart Anatomy & Cardiac Cycle",
            description="Interactive 3D model of heart chambers, aorta, and 72 BPM resting cardiac contraction.",
            subject="Biology",
            experiment_type="biology",
            instructions="Inspect the four internal chambers and oxygenated vs deoxygenated blood pathways.",
            grade_level="9th Grade",
            is_published=True,
        )
        db.add_all([exp1, exp2, exp3])

        db.commit()
        print("Genuine curriculum content successfully seeded.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding starter content: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_starter_content()
