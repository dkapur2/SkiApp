import { fireEvent, render } from '@testing-library/react-native';

import { ElevationControl, FreshnessBlock } from '@/components/forecast-ui';
import { StatePanel } from '@/components/state-panel';

describe('accessible forecast controls and states', () => {
  it('exposes one checked elevation and changes it', () => {
    const onChange = jest.fn();
    const view = render(<ElevationControl value="mid" onChange={onChange} />);

    expect(view.getByRole('radio', { name: 'Mid elevation', checked: true })).toBeOnTheScreen();
    fireEvent.press(view.getByRole('radio', { name: 'Peak elevation' }));
    expect(onChange).toHaveBeenCalledWith('peak');
  });

  it('explains offline data without showing false zero values', () => {
    const view = render(<StatePanel kind="offline" onRetry={jest.fn()} />);

    expect(view.getByText('You appear to be offline')).toBeOnTheScreen();
    expect(view.getByText(/never turn a missing forecast into zero/i)).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });

  it('shows provider and server freshness without inventing a model run', () => {
    const view = render(
      <FreshnessBlock
        weather={{
          source: 'open-meteo',
          fetched_at: new Date().toISOString(),
          model_run_at: null,
        }}
      />,
    );

    expect(view.getByText('Open-Meteo forecast')).toBeOnTheScreen();
    expect(view.getByText(/Server fetched/)).toBeOnTheScreen();
    expect(view.getByText('Provider model run')).toBeOnTheScreen();
    expect(view.getByText('Not provided')).toBeOnTheScreen();
  });
});
