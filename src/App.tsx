import React, { useState } from 'react';
import { PlanResult } from './types';
import { checkBudget, parseItinerary } from './utils/parser';

export default function App() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number | string>(3);
  const [budget, setBudget] = useState<number | string>(15000);
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    setError(null);

    const parsedDays = parseInt(String(days), 10) || 3;
    const parsedBudget = parseInt(String(budget), 10) || 15000;

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          days: parsedDays,
          budget: parsedBudget,
          interest: interest.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const text: string = data.text || '';

      const { pySum, modelTotal } = checkBudget(text);
      const daysData = parseItinerary(text);
      const pct = parsedBudget > 0 ? Math.min(100, Math.round((pySum / parsedBudget) * 100)) : 0;
      const over = pySum > parsedBudget;

      setResult({
        rawText: text,
        daysData,
        pySum,
        modelTotal,
        budget: parsedBudget,
        pct,
        over,
        destination: destination.trim(),
        days: parsedDays,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Something went wrong: ${msg}. Try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getChipClass = (label: string): string => {
    const clean = label.trim().toLowerCase().replace(/\s+/g, '-');
    return clean;
  };

  return (
    <main>
      <h1>Where to next?</h1>
      <p className="sub">Tell us a few things and get a day-by-day plan.</p>

      <form id="f" className="clay" onSubmit={handleSubmit}>
        <label className="full">
          Destination
          <input
            name="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Goa"
            required
            disabled={loading}
          />
        </label>
        <label>
          Days
          <input
            name="days"
            type="number"
            min="1"
            max="14"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label>
          Budget in rupees
          <input
            name="budget"
            type="number"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label className="full">
          What you enjoy
          <input
            name="interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="beaches, street food"
            required
            disabled={loading}
          />
        </label>
        <button id="b" type="submit" disabled={loading}>
          {loading ? 'Putting your days together...' : 'Plan my trip'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="plan">
          <h2>
            Your {result.days} days in {result.destination}
          </h2>
          <p className="spend">
            About <strong>Rs {result.pySum}</strong> of your Rs {result.budget}.
          </p>
          <div className={`track ${result.over ? 'over' : ''}`}>
            <span style={{ width: `${result.pct}%` }} />
          </div>

          {result.over && (
            <p className="warn">
              That's Rs {result.pySum - result.budget} over your budget. Try again, or raise it a little.
            </p>
          )}

          {result.modelTotal !== null && result.modelTotal !== result.pySum && (
            <p className="aside">
              The AI wrote its own total as Rs {result.modelTotal}, but the items add up to Rs {result.pySum}. We went
              with the items.
            </p>
          )}

          {result.daysData && result.daysData.length > 0 ? (
            result.daysData.map((d) => (
              <section key={d.n} className="day clay">
                <h3>
                  Day {d.n} <span>Rs {d.total}</span>
                </h3>
                <ul className="stops">
                  {d.items.map((it, idx) => (
                    <li key={idx}>
                      <span className={`chip ${getChipClass(it.label)}`}>{it.label}</span>
                      <span>{it.desc}</span>
                      <span className="cost">Rs {it.cost}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <pre className="clay">{result.rawText}</pre>
          )}

          <p className="note">Prices are rough guesses. Check them before you book.</p>
        </section>
      )}
    </main>
  );
}
