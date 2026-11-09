import { describe, expect, it } from 'vitest'
import { createWorkspaceFixture } from '@/test/workspaceFixture'
import { localDate } from '@/lib/dates'
import { deleteCaseRecord, saveCaseRecord, saveLearningNote } from './mutations'

const userId = '00000000-0000-4000-8000-000000000001'

describe('cases handled learning log', () => {
  it('saves a broad category and general takeaway linked to a calendar date', () => {
    const workspace = createWorkspaceFixture()
    const result = saveCaseRecord(
      workspace,
      {
        plannerItemId: 'calendar-entry-test',
        entryDate: workspace.plannerItems[0].date,
        category: 'care-coordination',
        learningTakeaway:
          'I noticed early coordination helped the team prepare.',
      },
      userId,
      'case-new',
      false,
    )
    expect(result.caseRecords.at(-1)).toMatchObject({
      id: 'case-new',
      userId,
      category: 'care-coordination',
      entryDate: workspace.plannerItems[0].date,
      plannerItemId: 'calendar-entry-test',
    })
  })

  it('rejects another account calendar link and a mismatched calendar date', () => {
    const workspace = createWorkspaceFixture()
    workspace.plannerItems[0].userId = 'another-user'
    expect(() =>
      saveCaseRecord(
        workspace,
        {
          plannerItemId: 'calendar-entry-test',
          entryDate: workspace.plannerItems[0].date,
          category: 'patient-education',
          learningTakeaway: '',
        },
        userId,
        'case-new',
        false,
      ),
    ).toThrow('Choose a calendar entry on the selected date')

    const owned = createWorkspaceFixture()
    expect(() =>
      saveCaseRecord(
        owned,
        {
          plannerItemId: 'calendar-entry-test',
          entryDate: localDate(new Date(Date.now() + 86_400_000)),
          category: 'patient-education',
          learningTakeaway: '',
        },
        userId,
        'case-new',
        false,
      ),
    ).toThrow('selected date')
  })

  it('lets notes link to a case entry and clears links without deleting the note', () => {
    const workspace = createWorkspaceFixture()
    const entryDate = workspace.caseRecords[0].entryDate
    const withNote = saveLearningNote(
      workspace,
      {
        shiftId: '',
        plannerItemId: '',
        caseRecordId: 'case-record-test',
        entryDate,
        topic: 'Reflect on coordination',
        question: '',
        followUp: '',
      },
      userId,
      'case-note',
      false,
    )
    expect(withNote.learningNotes.at(-1)?.caseRecordId).toBe('case-record-test')
    const deleted = deleteCaseRecord(withNote, 'case-record-test')
    expect(
      deleted.caseRecords.some((record) => record.id === 'case-record-test'),
    ).toBe(false)
    expect(
      deleted.learningNotes.find((note) => note.id === 'case-note'),
    ).toMatchObject({
      caseRecordId: null,
      topic: 'Reflect on coordination',
    })
  })
})
