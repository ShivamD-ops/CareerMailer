import React, { useState } from 'react';

const SendMailPage: React.FC = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/send/mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // important to send cookies/session
        body: JSON.stringify({ to, subject, text, html }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send mail');
      } else {
        setResponseMsg('Email sent successfully');
        // Optionally clear form here
        setTo('');
        setSubject('');
        setText('');
        setHtml('');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Send Test Email</h2>
      <form onSubmit={handleSubmit}>
        <label>
          To Email:<br />
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
        </label>
        <label>
          Subject:<br />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
        </label>
        <label>
          Text Content:<br />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
        </label>
        <label>
          HTML Content:<br />
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </form>

      {responseMsg && <p style={{ color: 'green', marginTop: 12 }}>{responseMsg}</p>}
      {errorMsg && <p style={{ color: 'red', marginTop: 12 }}>{errorMsg}</p>}
    </div>
  );
};

export default SendMailPage;
