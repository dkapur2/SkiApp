import { fireEvent, renderRouter, waitFor } from 'expo-router/testing-library';

import * as api from '@/api/client';

import { resortCatalogFixture, resortConditionsFixture } from './fixtures';

jest.mock('@/api/client', () => {
  const actual = jest.requireActual('@/api/client');
  return {
    ...actual,
    fetchResortCatalog: jest.fn(),
    fetchResortConditions: jest.fn(),
  };
});

describe('Today to resort-detail vertical slice', () => {
  beforeEach(() => {
    jest.mocked(api.fetchResortCatalog).mockResolvedValue(resortCatalogFixture);
    jest.mocked(api.fetchResortConditions).mockResolvedValue(resortConditionsFixture);
  });

  it('opens a real-data detail route and changes elevation', async () => {
    const router = renderRouter('src/app', { initialUrl: '/' });

    expect(await router.findByText('Elk Mountain')).toBeOnTheScreen();
    fireEvent.press(router.getByRole('button', { name: 'Open full forecast' }));

    await waitFor(() => expect(router.getPathname()).toBe('/resorts/elk-mountain'));
    expect(await router.findByLabelText(/Temperature: 28°F/)).toBeOnTheScreen();

    fireEvent.press(router.getByRole('radio', { name: 'Peak elevation' }));
    expect(await router.findByLabelText(/Temperature: 22°F/)).toBeOnTheScreen();
    expect(router.getByText('Resort operations unknown')).toBeOnTheScreen();
  });
});
