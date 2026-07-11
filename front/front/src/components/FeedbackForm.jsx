import React, { useState } from 'react';

// Web3Forms access key. Get a free one at https://web3forms.com — enter
// info@develope.ar and paste the key you receive by email here. Submissions
// are delivered to that inbox.
const ACCESS_KEY = 'daa2edd1-bb6d-4148-ac67-00e972329096';

export default function FeedbackForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');

    const form = e.target;
    const payload = {
      access_key: ACCESS_KEY,
      subject: 'Opiniones sobre CaudalGuru',
      from_name: 'CaudalGuru',
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
      // Honeypot: bots fill this, humans don't.
      botcheck: form.botcheck.checked,
    };

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('ok');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <section className="mt-12 max-w-md mx-auto text-center">
        <div className="rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
          <p className="text-emerald-400 font-semibold text-sm">¡Gracias por tu opinión! 🙌</p>
          <p className="text-slate-400 text-xs mt-1">La recibimos correctamente.</p>
        </div>
      </section>
    );
  }

  const inputClass =
    'w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white ' +
    'placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 ' +
    'focus:ring-emerald-500/40 transition-colors';

  return (
    <section className="mt-12 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Enviá tu opinión</h2>
        <p className="text-slate-500 text-xs mt-1">
          Contanos qué te parece o qué te gustaría ver
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          required
          placeholder="Tu nombre"
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Tu email"
          className={inputClass}
        />
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Tu opinión..."
          className={`${inputClass} resize-none`}
        />

        {/* Honeypot field — hidden from humans, visible to bots. */}
        <label className="hidden">
          <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
        </label>

        {status === 'error' && (
          <p className="text-red-400 text-xs text-center">
            Hubo un error al enviar. Probá de nuevo o escribinos a info@develope.ar
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50
            disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5
            transition-colors"
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}
