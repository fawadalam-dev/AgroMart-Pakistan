import React, { useRef, useState } from 'react'

const quickQuestions = [
  'My tomato leaves are turning yellow',
  'Which fertilizer is good for wheat?',
  'How often should I water my crop?',
  'What should I do about aphids?'
]

const advice = [
  { keywords: ['yellow', 'pale'], title: 'Yellow leaves', text: 'Check soil moisture and drainage first. Yellowing can indicate overwatering or nitrogen shortage. Use a soil test before applying fertilizer.', action: 'For a confirmed nitrogen deficiency, use a balanced fertilizer such as NPK 15-15-15 according to the label.' },
  { keywords: ['spot', 'spots', 'blight', 'fungus', 'mold'], title: 'Possible fungal disease', text: 'Remove badly affected leaves, improve airflow, avoid wetting leaves, and do not compost infected material.', action: 'Ask a local agriculture officer about a crop-approved copper or fungicide product. Follow its label and pre-harvest interval.' },
  { keywords: ['aphid', 'insect', 'pest', 'bug', 'whitefly'], title: 'Possible insect pressure', text: 'Inspect the underside of leaves and isolate heavily affected plants. Encourage beneficial insects and wash small infestations with water.', action: 'For severe infestation, use an approved neem-based or crop-specific insecticide exactly as the label says.' },
  { keywords: ['fertilizer', 'fertiliser', 'npk', 'urea'], title: 'Fertilizer guidance', text: 'The right fertilizer depends on crop, soil test, growth stage, and irrigation. Avoid guessing with high doses.', action: 'Share your crop and growth stage. As a general guide, compost plus a balanced NPK is safer than repeated urea without a soil test.' },
  { keywords: ['water', 'irrigation', 'dry', 'thirst'], title: 'Watering guidance', text: 'Check soil 5 to 8 cm below the surface before irrigating. Water deeply at the root zone and avoid standing water.', action: 'Drip irrigation or early-morning watering can reduce evaporation and leaf disease risk.' }
]

function getReply(question) {
  const normalized = question.toLowerCase()
  const match = advice.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)))
  if (match) return `**${match.title}**\n${match.text}\n\n**Recommended next step:** ${match.action}`
  if (normalized.includes('tomato')) return '**Tomato care**\nCheck leaf undersides for pests, avoid watering over the leaves, and inspect for spots or curling. Tell me whether the leaves are yellow, curled, spotted, or wilting so I can narrow the possible causes.'
  if (normalized.includes('wheat')) return '**Wheat care**\nUse a soil test before fertilizer. Balanced nutrition, timely irrigation, and checking for rust or aphids are important. Tell me the wheat growth stage and visible symptom.'
  if (normalized.includes('rice')) return '**Rice care**\nKeep water management consistent, watch for leaf discoloration and stem pests, and avoid applying fertilizer without considering soil and crop stage.'
  if (normalized.includes('potato')) return '**Potato care**\nUse well-drained soil, avoid prolonged leaf wetness, and inspect for blight symptoms or beetles. Share a photo and describe the spots for safer guidance.'
  return '**Farmer guidance**\nPlease tell me the crop name, plant age, visible symptoms, watering routine, and when the problem started. You can also upload a clear photo of the leaves, stem, and whole plant.\n\nI can help with crop care, fertilizer basics, pest signs, irrigation, soil preparation, and harvest planning.'
}

function formatReply(text) {
  return text.split('\n').map((line, index) => {
    const bold = line.match(/^\*\*(.+)\*\*(.*)$/)
    return <p key={`${line}-${index}`}>{bold ? <><strong>{bold[1]}</strong>{bold[2]}</> : line || '\u00a0'}</p>
  })
}

export default function Assistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Assalam-o-alaikum! I am AgroMart Farmer Assistant. Ask me about crops, fertilizer, pests, watering, or upload a plant photo for symptom guidance.' }])
  const [question, setQuestion] = useState('')
  const [plantImage, setPlantImage] = useState(null)
  const [asking, setAsking] = useState(false)
  const [apiError, setApiError] = useState('')
  const imageInputRef = useRef(null)

  async function askQuestion(value = question, imageData = null) {
    const cleanQuestion = value.trim()
    if (!cleanQuestion && !imageData) return
    const userMessage = cleanQuestion || 'Please check this plant photo.'
    setMessages((current) => [...current, { role: 'user', text: userMessage }])
    setQuestion('')
    setAsking(true)
    setApiError('')
    try {
      const apiReply = await askAiApi(userMessage, imageData)
      setMessages((current) => [...current, { role: 'assistant', text: apiReply || getReply(userMessage) }])
    } catch (error) {
      setApiError(error.message)
      setMessages((current) => [...current, { role: 'assistant', text: `${getReply(userMessage)}\n\nThe live AI service is unavailable, so this is general guidance.` }])
    } finally {
      setAsking(false)
    }
  }

  async function handleImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setPlantImage(imageUrl)
    const imageData = await readImage(file)
    await askQuestion('I uploaded a plant photo. Identify possible symptoms and give safe next steps.', imageData)
  }

  return (
    <section className="assistant-page">
      <div className="assistant-header">
        <div>
          <p className="section-kicker">AgroMart farmer support</p>
          <h1>AI Farmer Assistant</h1>
          <p>Ask practical farming questions or upload a plant photo for first-step guidance.</p>
        </div>
        <span className={`assistant-status ${AI_API_KEY ? 'api-ready' : 'api-missing'}`}>{AI_API_KEY ? 'AI API connected' : 'ASK QUESTION'}</span>
      </div>

      <div className="assistant-layout">
        <aside className="assistant-tools">
          <h2>Ask about</h2>
          <div className="quick-question-list">
            {quickQuestions.map((item) => <button key={item} type="button" onClick={() => askQuestion(item)}>{item}</button>)}
          </div>
          <label className="photo-upload">
            <span>Take or upload plant photo</span>
            <input ref={imageInputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} />
          </label>
          {plantImage && <img className="plant-preview" src={plantImage} alt="Uploaded plant preview" />}
          <p className="assistant-disclaimer">Safety note: AI guidance is not a laboratory diagnosis. Confirm disease and chemical use with a qualified agriculture officer, and always follow the product label.</p>
          {apiError && <p className="assistant-config-note">{apiError} Using local guidance for now.</p>}
        </aside>

        <div className="chat-panel">
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{formatReply(message.text)}</div>)}
          </div>
          <form className="chat-input-row" onSubmit={(event) => { event.preventDefault(); askQuestion() }}>
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your crop or plant problem..." aria-label="Ask the farmer assistant" />
            <button type="submit" disabled={asking}>{asking ? 'Thinking...' : 'Ask'}</button>
          </form>
          <button type="button" className="clear-chat-btn" onClick={() => setMessages([])}>Clear conversation</button>
        </div>
      </div>
    </section>
  )
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1/chat/completions'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini'

async function askAiApi(question, imageData) {
  if (!AI_API_KEY) return null
  const content = imageData ? [
    { type: 'text', text: question },
    { type: 'image_url', image_url: { url: imageData } }
  ] : question
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are a careful agriculture assistant for farmers in Pakistan. Use simple language. Ask for crop, location, growth stage, and symptoms when missing. For photos, give possible causes only, never a certain diagnosis. Recommend soil testing and qualified agriculture officers before pesticides. Never invent exact doses; follow product labels.' },
        { role: 'user', content }
      ]
    })
  })
  if (!response.ok) throw new Error('AI service request failed')
  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}