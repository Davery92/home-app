import { render, screen } from '@testing-library/react';
import App from './App';

test('shows login when no token', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});
