import { render, screen } from '@testing-library/react';
import App from './App';

test('renders application title', () => {
  render(<App />);
  const heading = screen.getByText(/Genogram Builder/i);
  expect(heading).toBeInTheDocument();
});
