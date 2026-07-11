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
      <section className="mt-11 max-w-md">
        <div className="rounded-md p-5 bg-medio-bg text-medio">
          <p className="font-semibold text-sm">¡Gracias por tu opinión!</p>
          <p className="text-ink-2 text-xs mt-1">La recibimos correctamente.</p>
        </div>
      </section>
    );
  }

  const inputClass =
    'w-full rounded bg-panel border border-hairline px-3 py-2 text-sm text-ink ' +
    'placeholder:text-ink-3 focus:outline-none focus:border-agua transition-colors';

  return (
    <section className="mt-11 max-w-md">
      <div className="mb-4">
        <h2 className="font-display font-bold uppercase text-xl tracking-wide text-ink m-0">Enviá tu opinión</h2>
        <p className="text-ink-3 text-xs mt-1">
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
          <p className="text-muy-alto text-xs">
            Hubo un error al enviar. Probá de nuevo o escribinos a info@develope.ar
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded bg-agua hover:opacity-90 disabled:opacity-50
            disabled:cursor-not-allowed text-page font-semibold text-sm py-2.5
            transition-opacity"
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}
