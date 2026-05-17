// Mock implementation — no Supabase connection
import {
  getMockContacts,
  getMockContact,
  saveMockContact,
  toggleMockFollowUp,
  deleteMockContact,
} from './mockData.js'

export function getContacts(opts) {
  return Promise.resolve(getMockContacts(opts))
}

export function getContact(id) {
  const c = getMockContact(id)
  return c ? Promise.resolve(c) : Promise.reject(new Error('Not found'))
}

export function saveContact(contact) {
  return Promise.resolve(saveMockContact(contact))
}

export function toggleFollowUp(id) {
  return Promise.resolve(toggleMockFollowUp(id))
}

export function deleteContact(id) {
  deleteMockContact(id)
  return Promise.resolve()
}

export async function uploadCardImage() {
  return null // no-op in mock mode
}
