export async function embedQuestion(data) {
  await fetch("http://localhost:8000/embed-question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
}

export async function embedMissingQuestions() {
  await fetch("http://localhost:8000/embed-missing-questions", {
    method: "POST"
  })
}