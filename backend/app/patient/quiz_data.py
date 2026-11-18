YES = [(1, "Yes", 1), (2, "No", 0)]
NO = [(1, "Yes", 0), (2, "No", 1)]

BEIS_OPTIONS = [
    (1, "Strongly Disagree", 1),
    (2, "Disagree", 2),
    (3, "Neither Agree nor Disagree", 3),
    (4, "Agree", 4),
    (5, "Strongly Agree", 5),
]

TIME_OPTIONS = [
    (1, "All of the time", 1),
    (2, "Most of the time", 2),
    (3, "A good bit of the time", 3),
    (4, "Some of the time", 4),
    (5, "A little of the time", 5),
    (6, "None of the time", 6),
]

OFTEN_OPTIONS = [
    (1, "Always", 1),
    (2, "Very often", 2),
    (3, "Fairly often", 3),
    (4, "Sometimes", 4),
    (5, "Almost never", 5),
    (6, "Never", 6),
]

HAPPY_OPTIONS = [
    (1, "Extremely happy, could not have been more satisfied or pleased", 1),
    (2, "Very happy most of the time", 2),
    (3, "Generally, satisfied, pleased", 3),
    (4, "Sometimes fairly satisfied, sometimes fairly unhappy", 4),
    (5, "Generally dissatisfied, unhappy", 5),
    (6, "Very dissatisfied, unhappy most of the time", 6),
]

MIND_OPTIONS = [
    (1, "No, not at all", 1),
    (2, "Maybe a little", 2),
    (3, "Yes, but not enough to be concerned or worried about", 3),
    (4, "Yes, and I have been a little concerned", 4),
    (5, "Yes, and I am quite concerned", 5),
    (6, "Yes, I am very much concerned about it", 6),
]

DEPRESSED_OPTIONS = [
    (1, "Yes, to the point that I did not care about anything for days at a time", 1),
    (2, "Yes, very depressed almost every day", 2),
    (3, "Yes, quite depressed several times", 3),
    (4, "Yes, a little depressed now and then", 4),
    (5, "No, never felt depressed at all", 5),
]

CONTROL_OPTIONS = [
    (1, "Yes, very definitely", 1),
    (2, "Yes, for the most part", 2),
    (3, "Yes, I guess so", 3),
    (4, "No, not too well", 4),
    (5, "No, and I am somewhat disturbed", 5),
    (6, "No, and I am very disturbed", 6),
]

NERVES_OPTIONS = [
    (1, "Extremely so, to the point where I could not take care of things", 1),
    (2, "Very much bothered", 2),
    (3, "Bothered quite a bit by nerves", 3),
    (4, "Bothered some, enough to notice", 4),
    (5, "Bothered just a little by nerves", 5),
    (6, "Not bothered at all by this", 6),
]

LIFE_OPTIONS = [
    (1, "Yes, very often", 1),
    (2, "Yes, fairly often", 2),
    (3, "Yes, a couple of times", 3),
    (4, "Yes, at one time", 4),
    (5, "No, never", 5),
]

ANXIOUS_OPTIONS = [
    (1, "Yes, extremely to the point of being sick or almost sick", 1),
    (2, "Yes, very much so", 2),
    (3, "Yes, quite a bit", 3),
    (4, "Yes, some, enough to bother me", 4),
    (5, "Yes, a little bit", 5),
    (6, "No, not at all", 6),
]

RESTED_OPTIONS = [
    (1, "Always, every day", 1),
    (2, "Almost every day", 2),
    (3, "Most days", 3),
    (4, "Some days, but usually not", 4),
    (5, "Hardly ever", 5),
    (6, "Never wake up feeling rested", 6),
]

STRAIN_OPTIONS = [
    (1, "Yes, almost more than I could stand or bear", 1),
    (2, "Yes, quite a bit of pressure", 2),
    (3, "Yes, some more than usual", 3),
    (4, "Yes, some, but about normal", 4),
    (5, "Yes, a little bit", 5),
    (6, "No, not at all", 6),
]

ASSESSMENTS = [
    {
        "code": "beis-10",
        "title": "Brief Emotional Intelligence Scale (BEIS-10)",
        "category": "Emotional Intelligence",
        "description": "Self-report scale to measure emotional intelligence.",
        "duration_label": "3-4 mins",
        "next_code": "mhi-38",
        "next_title": "Mental Health Inventory (MHI-38)",
        "blocks": [(1, 10, "Q 1 - 10")],
        "questions": [
            (1, "I know why my emotions change", "என் உணர்வுகள் ஏன் மாறுகின்றன என்று எனக்குத் தெரியும்", BEIS_OPTIONS),
            (2, "I easily recognise my emotions as I experience them", "நான் அனுபவிக்கும் போது என் உணர்வுகளை எளிதாக அறிந்துகொள்கிறேன்", BEIS_OPTIONS),
            (3, "I can tell how people are feeling by listening to the tone of their voice", "மக்கள் பேசும் குரல் தொனியைக் கேட்டு அவர்கள் எப்படி உணர்கிறார்கள் என்பதை என்னால் கூற முடியும்", BEIS_OPTIONS),
            (4, "By looking at their facial expressions, I recognise the emotions people are experiencing", "மக்களின் முகபாவனைகளைப் பார்த்து அவர்கள் அனுபவிக்கும் உணர்வுகளை நான் அறிந்துகொள்கிறேன்", BEIS_OPTIONS),
            (5, "I seek out activities that make me happy", "என்னை மகிழ்ச்சியாக்கும் செயல்களை நான் தேடுகிறேன்", BEIS_OPTIONS),
            (6, "I have control over my emotions", "என் உணர்வுகளை நான் கட்டுப்படுத்த முடியும்", BEIS_OPTIONS),
            (7, "I arrange events others enjoy", "மற்றவர்கள் விரும்பும் நிகழ்வுகளை நான் ஏற்பாடு செய்கிறேன்", BEIS_OPTIONS),
            (8, "I help other people feel better when they are down", "மற்றவர்கள் மனச்சோர்வடைந்திருக்கும்போது அவர்களை சரி செய்ய நான் உதவுகிறேன்", BEIS_OPTIONS),
            (9, "When I am in a positive mood, I am able to come up with new ideas", "நான் நல்ல மனநிலையில் இருக்கும்போது புதிய யோசனைகளை உருவாக்க முடிகிறது", BEIS_OPTIONS),
            (10, "I use good moods to help myself keep trying in the face of obstacles", "தடைகளை எதிர்கொள்ளும்போது தொடர்ந்து முயற்சி செய்ய நல்ல மனநிலையைப் பயன்படுத்துகிறேன்", BEIS_OPTIONS),
        ],
    },
    {
        "code": "mhi-38",
        "title": "Mental Health Inventory (MHI-38)",
        "category": "Mental Health",
        "description": "Measures mental health over the past month.",
        "duration_label": "13-16 mins",
        "next_code": "gds-15",
        "next_title": "Geriatric Depression Scale (Short Form)",
        "blocks": [(1, 20, "Q 1 - 20"), (21, 38, "Q 21 - 38")],
        "questions": [
            (1, "How happy, satisfied, or pleased have you been with your personal life during the past month?", "கடந்த மாதத்தில் உங்கள் தனிப்பட்ட வாழ்க்கையில் எவ்வளவு மகிழ்ச்சியாக, திருப்தியாக இருந்தீர்கள்?", HAPPY_OPTIONS),
            (2, "How much of the time have you felt lonely during the past month?", "கடந்த மாதத்தில் எவ்வளவு நேரம் தனியாக உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (3, "How often did you become nervous or jumpy when faced with excitement or unexpected situations during the past month?", "கடந்த மாதத்தில் உற்சாகம் அல்லது எதிர்பாராத சூழ்நிலைகளை எதிர்கொண்டபோது எத்தனை முறை பதட்டமாக அல்லது திடுக்கிட்டீர்கள்?", OFTEN_OPTIONS),
            (4, "During the past month, how much of the time have you felt that the future looks hopeful and promising?", "கடந்த மாதத்தில் எவ்வளவு நேரம் எதிர்காலம் நம்பிக்கையாகவும் உறுதியாகவும் தோன்றியது?", TIME_OPTIONS),
            (5, "How much of the time, during the past month, has your daily life been full of things that were interesting to you?", "கடந்த மாதத்தில் உங்கள் அன்றாட வாழ்க்கை உங்களுக்கு சுவாரஸ்யமான விஷயங்களால் எவ்வளவு நேரம் நிரப்பியிருந்தது?", TIME_OPTIONS),
            (6, "How much of the time, during the past month, did you feel relaxed and free from tension?", "கடந்த மாதத்தில் எவ்வளவு நேரம் நிதானமாகவும் பதற்றமில்லாமலும் உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (7, "During the past month, how much of the time have you generally enjoyed the things you do?", "கடந்த மாதத்தில் நீங்கள் செய்யும் செயல்களை எவ்வளவு நேரம் பொதுவாக மகிழ்ச்சியாக அனுபவித்தீர்கள்?", TIME_OPTIONS),
            (8, "During the past month, have you had any reason to wonder if you were losing your mind, or losing control over the way you act, talk, think, feel, or of your memory?", "கடந்த மாதத்தில் உங்கள் மனம் கலங்குகிறதா, அல்லது நீங்கள் செயல்படும், பேசும், சிந்திக்கும், உணரும் விதம் அல்லது நினைவாற்றலின் மீதான கட்டுப்பாட்டை இழக்கிறீர்களா என்று எண்ணியதுண்டா?", MIND_OPTIONS),
            (9, "Did you feel depressed during the past month?", "கடந்த மாதத்தில் மனச்சோர்வாக உணர்ந்தீர்களா?", DEPRESSED_OPTIONS),
            (10, "During the past month, how much of the time have you felt loved and wanted?", "கடந்த மாதத்தில் எவ்வளவு நேரம் நீங்கள் நேசிக்கப்படுகிறீர்கள், உங்களை மற்றவர் விரும்புகிறார்கள் என்று உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (11, "How much of the time, during the past month, have you been a very nervous person?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மிகவும் பதட்டமான நபராக இருந்தீர்கள்?", TIME_OPTIONS),
            (12, "When you have got up in the morning, this past month, about how often did you expect to have an interesting day?", "கடந்த மாதம் காலையில் எழுந்தபோது, சுவாரஸ்யமான நாள் இருக்கும் என்று எத்தனை முறை எதிர்பார்த்தீர்கள்?", OFTEN_OPTIONS),
            (13, "During the past month, how much of the time have you felt tense or “high-strung”?", "கடந்த மாதத்தில் எவ்வளவு நேரம் இறுக்கமாக அல்லது அதிக பதட்டமாக உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (14, "During the past month, have you been in firm control of your behaviour, thoughts, emotions or feelings?", "கடந்த மாதத்தில் உங்கள் நடத்தை, எண்ணங்கள், உணர்ச்சிகள் ஆகியவற்றின் மீது உறுதியான கட்டுப்பாடு இருந்ததா?", CONTROL_OPTIONS),
            (15, "During the past month, how often did your hands shake when you tried to do something?", "கடந்த மாதத்தில் ஏதாவது செய்ய முயன்றபோது உங்கள் கைகள் எத்தனை முறை நடுங்கின?", OFTEN_OPTIONS),
            (16, "During the past month, how often did you feel that you had nothing to look forward to?", "கடந்த மாதத்தில் எதிர்பார்க்க எதுவும் இல்லை என்று எத்தனை முறை உணர்ந்தீர்கள்?", OFTEN_OPTIONS),
            (17, "How much of the time, during the past month, have you felt calm and peaceful?", "கடந்த மாதத்தில் எவ்வளவு நேரம் அமைதியாகவும் சாந்தமாகவும் உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (18, "How much of the time, during the past month, have you felt emotionally stable?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மனரீதியாக நிலையானவராக உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (19, "How much of the time, during the past month, have you felt downhearted and blue?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மனம் சோர்ந்து சோகமாக உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (20, "How often have you felt like crying, during the past month?", "கடந்த மாதத்தில் அழ வேண்டும் என்று எத்தனை முறை உணர்ந்தீர்கள்?", OFTEN_OPTIONS),
            (21, "During the past month, how often have you felt that others would be better off if you were dead?", "கடந்த மாதத்தில் நீங்கள் இல்லாவிட்டால் மற்றவர்களுக்கு நன்றாக இருக்கும் என்று எத்தனை முறை உணர்ந்தீர்கள்?", OFTEN_OPTIONS),
            (22, "How much of the time, during the past month, were you able to relax without difficulty?", "கடந்த மாதத்தில் எவ்வளவு நேரம் சிரமமின்றி நிதானமாக இருக்க முடிந்தது?", TIME_OPTIONS),
            (23, "How much of the time, during the past month, did you feel that your love relationships, loving and being loved, were full and complete?", "கடந்த மாதத்தில் உங்கள் அன்பு உறவுகள், நேசிப்பதும் நேசிக்கப்படுவதும், நிறைவாக இருந்ததாக எவ்வளவு நேரம் உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (24, "How often, during the past month, did you feel that nothing turned out for you the way you wanted it to?", "கடந்த மாதத்தில் எதுவும் நீங்கள் விரும்பியபடி அமையவில்லை என்று எத்தனை முறை உணர்ந்தீர்கள்?", OFTEN_OPTIONS),
            (25, "How much have you been bothered by nervousness, or your “nerves”, during the past month?", "கடந்த மாதத்தில் பதட்டம் அல்லது நரம்புத் தளர்ச்சி எவ்வளவு உங்களைத் தொந்தரவு செய்தது?", NERVES_OPTIONS),
            (26, "During the past month, how much of the time has living been a wonderful adventure for you?", "கடந்த மாதத்தில் வாழ்க்கை உங்களுக்கு எவ்வளவு நேரம் அற்புதமான அனுபவமாக இருந்தது?", TIME_OPTIONS),
            (27, "How often, during the past month, have you felt so down in the dumps that nothing could cheer you up?", "கடந்த மாதத்தில் எதுவும் மனதை மகிழ்விக்காத அளவு மிகவும் சோர்வாக எத்தனை முறை உணர்ந்தீர்கள்?", OFTEN_OPTIONS),
            (28, "During the past month, did you think about taking your own life?", "கடந்த மாதத்தில் உங்கள் உயிரை மாய்த்துக்கொள்ள நினைத்தீர்களா?", LIFE_OPTIONS),
            (29, "During the past month, how much of the time have you felt restless, fidgety, or impatient?", "கடந்த மாதத்தில் எவ்வளவு நேரம் அமைதியின்மை, துடிதுடிப்பு அல்லது பொறுமையின்மை உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (30, "During the past month, how much of the time have you been moody or brooded about things?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மனநிலை மாற்றத்துடன் அல்லது விஷயங்களைப் பற்றி அதிகம் யோசித்து இருந்தீர்கள்?", TIME_OPTIONS),
            (31, "How much of the time, during the past month, have you felt cheerful, lighthearted?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மகிழ்ச்சியாகவும் லேசான மனதுடனும் உணர்ந்தீர்கள்?", TIME_OPTIONS),
            (32, "During the past month, how often did you get rattled, upset or flustered?", "கடந்த மாதத்தில் எத்தனை முறை குழப்பமடைந்து, வருத்தமடைந்து அல்லது திகைத்தீர்கள்?", OFTEN_OPTIONS),
            (33, "During the past month, have you been anxious or worried?", "கடந்த மாதத்தில் நீங்கள் கவலையாக அல்லது பதட்டமாக இருந்தீர்களா?", ANXIOUS_OPTIONS),
            (34, "During the past month, how much of the time were you a happy person?", "கடந்த மாதத்தில் எவ்வளவு நேரம் மகிழ்ச்சியான நபராக இருந்தீர்கள்?", TIME_OPTIONS),
            (35, "How often during the past month did you find yourself trying to calm down?", "கடந்த மாதத்தில் உங்களை அமைதிப்படுத்த முயன்றது எத்தனை முறை?", OFTEN_OPTIONS),
            (36, "During the past month, how much of the time have you been in low or very low spirits?", "கடந்த மாதத்தில் எவ்வளவு நேரம் தளர்ந்த அல்லது மிகவும் தளர்ந்த மனநிலையில் இருந்தீர்கள்?", TIME_OPTIONS),
            (37, "How often, during the past month, have you been waking up feeling fresh and rested?", "கடந்த மாதத்தில் புத்துணர்ச்சியுடனும் ஓய்வாகவும் எழுந்தது எத்தனை முறை?", RESTED_OPTIONS),
            (38, "During the past month, have you been under or felt you were under any strain, stress or pressure?", "கடந்த மாதத்தில் நீங்கள் மன அழுத்தம், இறுக்கம் அல்லது நெருக்கடியில் இருந்தீர்களா?", STRAIN_OPTIONS),
        ],
    },
    {
        "code": "gds-15",
        "title": "Geriatric Depression Scale (Short Form)",
        "category": "Depression (Geriatric)",
        "description": "Self-rated depression screening for elderly patients.",
        "duration_label": "5-6 mins",
        "answer_kind": "yes-no",
        "next_code": None,
        "next_title": "Big Five Inventory-10 (BFI-10)",
        "blocks": [(1, 15, "Q 1 - 15")],
        "questions": [
            (1, "Are you basically satisfied with your life?", "உங்கள் வாழ்க்கையில் நீங்கள் அடிப்படையில் திருப்தியாக இருக்கிறீர்களா?", NO),
            (2, "Have you dropped many of your activities and interests?", "உங்கள் பல செயல்களையும் ஆர்வங்களையும் கைவிட்டுவிட்டீர்களா?", YES),
            (3, "Do you feel that your life is empty?", "உங்கள் வாழ்க்கை வெறுமையாக உள்ளதாக உணர்கிறீர்களா?", YES),
            (4, "Do you often get bored?", "நீங்கள் அடிக்கடி சலிப்பாக உணர்கிறீர்களா?", YES),
            (5, "Are you in good spirits most of the time?", "பெரும்பாலான நேரம் நீங்கள் நல்ல மனநிலையில் இருக்கிறீர்களா?", NO),
            (6, "Are you afraid that something bad is going to happen to you?", "உங்களுக்கு ஏதாவது கெட்டது நடக்கப்போகிறது என்று பயமாக இருக்கிறதா?", YES),
            (7, "Do you feel happy most of the time?", "பெரும்பாலான நேரம் மகிழ்ச்சியாக உணர்கிறீர்களா?", NO),
            (8, "Do you often feel helpless?", "நீங்கள் அடிக்கடி உதவியற்றவராக உணர்கிறீர்களா?", YES),
            (9, "Do you prefer to stay at home, rather than going out and doing new things?", "புதிய செயல்களைச் செய்வதை விட வீட்டிலேயே இருக்க விரும்புகிறீர்களா?", YES),
            (10, "Do you feel you have more problems with memory than most people?", "மற்றவர்களை விட உங்களுக்கு நினைவாற்றல் சிக்கல் அதிகம் என்று உணர்கிறீர்களா?", YES),
            (11, "Do you think it is wonderful to be alive now?", "இப்போது உயிருடன் இருப்பது அற்புதம் என்று நினைக்கிறீர்களா?", NO),
            (12, "Do you feel pretty worthless the way you are now?", "இப்போது உள்ளபடி நீங்கள் மதிப்பற்றவராக உணர்கிறீர்களா?", YES),
            (13, "Do you feel full of energy?", "நீங்கள் ஆற்றல் நிறைந்தவராக உணர்கிறீர்களா?", NO),
            (14, "Do you feel that your situation is hopeless?", "உங்கள் நிலை நம்பிக்கையற்றது என்று உணர்கிறீர்களா?", YES),
            (15, "Do you think that most people are better off than you are?", "பெரும்பாலானவர்கள் உங்களை விட நலமாக இருக்கிறார்கள் என்று நினைக்கிறீர்களா?", YES),
        ],
    },
]


def assessment_by_code(code):
    for item in ASSESSMENTS:
        if item["code"] == code:
            return item
    return None
