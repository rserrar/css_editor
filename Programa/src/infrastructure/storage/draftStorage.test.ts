// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DraftStorage } from './draftStorage';

describe('DraftStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('preserves legacy and scoped config keys when saving and loading drafts', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'draft-project',
        name: 'Draft Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'menu.option': {
          color: '#111111',
        },
        'layout.mainMenu/menu.option': {
          fontSize: '18px',
        },
      },
    };

    DraftStorage.save('session-1', project);
    const draft = DraftStorage.load('session-1');

    expect(draft?.project.config).toEqual({
      'menu.option': {
        color: '#111111',
      },
      'layout.mainMenu/menu.option': {
        fontSize: '18px',
      },
    });
  });

  it('preserves stateful config values when saving and loading drafts', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'draft-stateful-project',
        name: 'Draft Stateful Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'button.primary': {
          default: { color: '#111111' },
          hover: { color: '#222222' },
        },
      },
    };

    DraftStorage.save('session-2', project);
    const draft = DraftStorage.load('session-2');

    expect(draft?.project.config).toEqual({
      'button.primary': {
        default: { color: '#111111' },
        hover: { color: '#222222' },
      },
    });
  });
});
