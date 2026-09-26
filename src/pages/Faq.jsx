import React from 'react'

const questions = [
    {
        question: 'How do I place an order?',
        answer: <>Browse the Agri Shop, add available products to your cart, then complete the delivery details and payment method at checkout. Sign in with a customer account to place an order.</>
    },
    {
        question: 'Which payment methods can I use?',
        answer: <>Available options are shown at checkout. Depending on the store settings, these may include Cash on Delivery, Easypaisa, JazzCash, or bank transfer.</>
    },
    {
        question: 'How do I check my order status?',
        answer: <>Open <a href="#/order">Your Order</a> to view order details and the latest status linked to your account.</>
    },
    {
        question: 'Can I cancel an order?',
        answer: <>Eligible orders can be cancelled from the order history. If the cancel option is no longer available, contact the store using the details in the footer.</>
    },
    {
        question: 'Are market prices exact for my local mandi?',
        answer: <>Market prices are reference values. Actual mandi rates can differ by location, quality, season, and supply.</>
    },
    {
        question: 'Can the AI Farmer Assistant diagnose a crop disease?',
        answer: <>The assistant provides general first-step guidance, not a laboratory diagnosis. Confirm symptoms with a qualified agriculture officer and follow product labels.</>
    },
    {
        question: 'Why can a product be unavailable?',
        answer: <>Products appear when they are approved and in the catalog. Stock availability can change; check the product listing before checkout.</>
    },
    {
        question: 'How can I update my delivery information?',
        answer: <>Sign in and open <a href="#/profile">Profile</a> to update your saved delivery details. You can also review them during checkout.</>
    }
]

export default function Faq() {
    return (
        <section className="faq-page">
            <header className="faq-hero">
                <p className="section-kicker">AgroMart help center</p>
                <h1>Frequently asked questions</h1>
                <p>Answers about shopping, deliveries, market information, and crop guidance.</p>
            </header>
            <div className="faq-layout">
                <div className="faq-list">
                    {questions.map((item) => <details className="faq-item" key={item.question}>
                        <summary>{item.question}<span aria-hidden="true">+</span></summary>
                        <div className="faq-answer"><p>{item.answer}</p></div>
                    </details>)}
                </div>
                <aside className="faq-contact-panel">
                    <span className="faq-contact-icon" aria-hidden="true">?</span>
                    <h2>Still need help?</h2>
                    <p>Talk with the farmer assistant or contact the AgroMart team.</p>
                    <a href="#/assistant">Ask the assistant <span aria-hidden="true">→</span></a>
                    <a href="mailto:hello@fawadalam5813@gmail.com">Email AgroMart</a>
                </aside>
            </div>
        </section>
    )
}
