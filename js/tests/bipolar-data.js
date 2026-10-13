/**
 * bipolar-data.js
 *
 * Original, non-diagnostic self-reflection questionnaire about mood episodes.
 * Items are informed by clinical symptom descriptions (DSM-5-TR) and by
 * published bipolar screening research, but are not copied or adapted from
 * validated scales. Scores and result bands have not been clinically validated.
 *
 * Version history (bump `version` whenever questions or scoring change, so
 * answers saved with an older version are discarded instead of mixed up):
 *   1 - first draft (12 questions)
 *   2 - one idea per question and simpler English; added "how long it lasted"
 *       and "easily distracted"; "Not sure" is worth 0 and shown separately;
 *       small sections shown as text/count instead of bars; support box added.
 */

window.QuizData = window.QuizData || {};

window.QuizData.bipolar = {
    id: "bipolar",
    version: 2,
    title: "Bipolar Mood Patterns Self-Assessment",
    description:
        "Reflect on changes in your mood, energy, sleep, and activity. This is an original questionnaire for learning and self-reflection. It is not a validated test and it cannot diagnose anything.",
    instructions:
        "Think about times in your life when you felt very different from your usual self. If a question asks about a kind of period you have never had, answer No.",

    scaleLabels: [
        "No",
        "Not sure",
        "Yes"
    ],

    // "Not sure" is worth 0 points (it is not a Yes), but it is counted and
    // shown separately in the results.
    scaleScores: [0, 0, 1],
    unsureIndex: 1,

    questions: [

        // ---- Higher-energy periods ----
        {
            id: "q1",
            dimension: "highEnergy",
            text: "Have you ever had a period when you felt much more energetic, “high,” or irritable than usual?"
        },
        {
            id: "q2",
            dimension: "highEnergy",
            text: "Did that period last for several days or longer, not just one day?"
        },
        {
            id: "q3",
            dimension: "highEnergy",
            text: "During that period, did you need much less sleep than usual and still feel full of energy?"
        },
        {
            id: "q4",
            dimension: "highEnergy",
            text: "During that period, did your thoughts race or jump quickly from one idea to another?"
        },
        {
            id: "q5",
            dimension: "highEnergy",
            text: "During that period, did you talk much more or much faster than usual?"
        },
        {
            id: "q6",
            dimension: "highEnergy",
            text: "During that period, did you feel unusually confident, as if you could do much more than usual?"
        },
        {
            id: "q7",
            dimension: "highEnergy",
            text: "During that period, were you much more active than usual (for example, more social, more productive, or starting many projects)?"
        },
        {
            id: "q8",
            dimension: "highEnergy",
            text: "During that period, were you easily distracted, with your attention jumping from one thing to another?"
        },
        {
            id: "q9",
            dimension: "highEnergy",
            text: "During that period, did you take unusual risks or make impulsive choices (for example, spending, sex, or driving)?"
        },

        // ---- Low-mood periods ----
        {
            id: "q10",
            dimension: "lowMood",
            text: "Have you had a separate period of about two weeks or longer when you felt sad, empty, or hopeless, or lost interest in most things?"
        },
        {
            id: "q11",
            dimension: "lowMood",
            text: "During a low period, did your sleep, appetite, or energy change a lot?"
        },
        {
            id: "q12",
            dimension: "lowMood",
            text: "During a low period, did you feel worthless or very guilty?"
        },

        // ---- Impact on daily life (both kinds of period) ----
        {
            id: "q13",
            dimension: "impact",
            text: "Did other people notice that you were not acting like your usual self during these periods?"
        },
        {
            id: "q14",
            dimension: "impact",
            text: "Did these periods cause serious problems in daily life (for example, at work or school, in relationships, or with money)?"
        },

        // ---- Pattern over time ----
        {
            id: "q15",
            dimension: "pattern",
            text: "Between these periods, did your mood and energy go back to normal?"
        },

        // ---- Other possible explanations ----
        {
            id: "q16",
            dimension: "context",
            text: "Did these changes happen only when you were using alcohol or drugs, taking certain medicines, or dealing with a medical illness?"
        }
    ],

    // A few questions per section are too few for a precise percentage, so
    // only the 9-question section is a bar. The others show a count ("2 of 3")
    // or just a sentence. None of these bands are clinically validated.
    dimensions: [
        {
            id: "highEnergy",
            name: "Higher-energy periods",
            icon: "bolt",
            interpretation: [
                { min: 0, max: 3, label: "You answered Yes to only a few of these questions." },
                { min: 4, max: 6, label: "You answered Yes to some of these questions." },
                { min: 7, max: 9, label: "You answered Yes to many of these questions." }
            ]
        },
        {
            id: "lowMood",
            name: "Low-mood periods",
            icon: "mood-sad",
            display: "count",
            interpretation: [
                { min: 0, max: 0, label: "You did not answer Yes to any of these questions." },
                { min: 1, max: 1, label: "You answered Yes to one of these questions." },
                { min: 2, max: 2, label: "You answered Yes to two of these questions." },
                { min: 3, max: 3, label: "You answered Yes to all of these questions." }
            ]
        },
        {
            id: "impact",
            name: "Impact on daily life",
            icon: "activity",
            display: "count",
            interpretation: [
                { min: 0, max: 0, label: "You did not answer Yes to either question." },
                { min: 1, max: 1, label: "You answered Yes to one question." },
                { min: 2, max: 2, label: "You answered Yes to both questions." }
            ]
        },
        {
            id: "pattern",
            name: "Pattern over time",
            icon: "chart-line",
            display: "text",
            interpretation: [
                { min: 0, max: 0, label: "You did not say that your mood and energy went back to normal between these periods." },
                { min: 1, max: 1, label: "You said your mood and energy went back to normal between these periods, like separate episodes." }
            ],
            unsureLabel: "You were not sure whether your mood and energy went back to normal between these periods."
        },
        {
            id: "context",
            name: "Other possible explanations",
            icon: "message-circle",
            display: "text",
            interpretation: [
                { min: 0, max: 0, label: "You said these changes also happened at times when none of those things were going on." },
                { min: 1, max: 1, label: "You said these changes only happened when you were using alcohol or drugs, taking certain medicines, or dealing with an illness. Those things can cause mood changes, so this is a good point to talk about with a health professional." }
            ],
            unsureLabel: "You were not sure whether something else could explain these changes. A health professional can help you check."
        }
    ],

    safetyNote:
        "<strong>If you need support right now:</strong> if you ever think about harming yourself, or you feel you may be in danger, contact your local emergency number or a crisis helpline right away. You can find helplines in your country at <a href=\"https://findahelpline.com\" target=\"_blank\" rel=\"noopener noreferrer\">findahelpline.com</a>.",

    attribution:
        "This is an original questionnaire. It was informed by the symptom descriptions in the DSM-5-TR and by research on bipolar disorder and screening tools, including the Mood Disorder Questionnaire (MDQ), the Hypomania Checklist-32 (HCL-32), the Bipolar Spectrum Diagnostic Scale (BSDS), and the Rapid Mood Screener (RMS). Its questions, scoring, and result bands are not validated and do not copy those tools. Your answers cannot show whether you have bipolar disorder; only a qualified health professional can assess that. " +
        "Sources: National Institute of Mental Health, Bipolar Disorder; American Psychiatric Association (2022), Diagnostic and Statistical Manual of Mental Disorders, 5th ed., text revision (DSM-5-TR); " +
        "Hirschfeld et al. (2000), American Journal of Psychiatry (MDQ); " +
        "Angst et al. (2005), Journal of Affective Disorders (HCL-32); " +
        "Ghaemi et al. (2005), Journal of Affective Disorders, 84, 273–277 (BSDS); " +
        "McIntyre et al. (2021), Current Medical Research and Opinion, 37(1), 135–144 (RMS); " +
        "Carvalho et al. (2015), Journal of Affective Disorders (review of bipolar screening tools)."
};
