'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'
import Card from './ui/Card'

interface Pet {
  id: string
  name: string
  type: string
  breed?: string
  birthDate?: string
  gender: string
  spayedNeutered: boolean
  weight?: {
    value: number
    unit: string
    lastUpdated: string
  }
  veterinarian?: {
    name?: string
    clinic?: string
    phone?: string
    email?: string
    address?: string
  }
  age?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface PetVaccine {
  id: string
  petId: string
  petName?: string
  petType?: string
  vaccineName: string
  vaccineType: string
  administeredDate: string
  expirationDate: string
  nextDueDate: string
  veterinarian?: {
    name?: string
    clinic?: string
    phone?: string
    licenseNumber?: string
  }
  batchLotNumber?: string
  manufacturer?: string
  administrationSite?: string
  isCore: boolean
  notes?: string
  status?: 'current' | 'due_soon' | 'overdue'
  isOverdue?: boolean
  isDueSoon?: boolean
  daysOverdue?: number
  createdAt: string
  updatedAt: string
}

interface VaccineStats {
  total: number
  current: number
  due_soon: number
  overdue: number
}

const PetCare: React.FC = () => {
  const { token } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [vaccines, setVaccines] = useState<PetVaccine[]>([])
  const [upcomingVaccines, setUpcomingVaccines] = useState<PetVaccine[]>([])
  const [overdueVaccines, setOverdueVaccines] = useState<PetVaccine[]>([])
  const [vaccineStats, setVaccineStats] = useState<VaccineStats>({
    total: 0,
    current: 0,
    due_soon: 0,
    overdue: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pets' | 'vaccines' | 'upcoming' | 'overdue'>('pets')
  const [showAddPetForm, setShowAddPetForm] = useState(false)
  const [showAddVaccineForm, setShowAddVaccineForm] = useState(false)
  const [newPet, setNewPet] = useState({
    name: '',
    type: 'dog',
    breed: '',
    birthDate: '',
    gender: 'unknown',
    spayedNeutered: false,
    weight: {
      value: 0,
      unit: 'lbs'
    },
    veterinarian: {
      name: '',
      clinic: '',
      phone: '',
      email: '',
      address: ''
    },
    notes: ''
  })
  const [newVaccine, setNewVaccine] = useState({
    vaccineName: '',
    vaccineType: 'other',
    administeredDate: '',
    expirationDate: '',
    nextDueDate: '',
    veterinarian: {
      name: '',
      clinic: '',
      phone: '',
      licenseNumber: ''
    },
    batchLotNumber: '',
    manufacturer: '',
    administrationSite: 'other',
    isCore: false,
    notes: ''
  })

  const petTypes = [
    { key: 'dog', label: '🐕 Dog', icon: '🐕' },
    { key: 'cat', label: '🐱 Cat', icon: '🐱' },
    { key: 'bird', label: '🦜 Bird', icon: '🦜' },
    { key: 'rabbit', label: '🐰 Rabbit', icon: '🐰' },
    { key: 'hamster', label: '🐹 Hamster', icon: '🐹' },
    { key: 'guinea_pig', label: '🐹 Guinea Pig', icon: '🐹' },
    { key: 'ferret', label: '🦫 Ferret', icon: '🦫' },
    { key: 'reptile', label: '🦎 Reptile', icon: '🦎' },
    { key: 'fish', label: '🐠 Fish', icon: '🐠' },
    { key: 'horse', label: '🐴 Horse', icon: '🐴' },
    { key: 'other', label: '🐾 Other', icon: '🐾' }
  ]

  const vaccineTypes = [
    // Dogs
    { key: 'rabies', label: 'Rabies', category: 'dog' },
    { key: 'dhpp', label: 'DHPP', category: 'dog' },
    { key: 'distemper', label: 'Distemper', category: 'dog' },
    { key: 'hepatitis', label: 'Hepatitis', category: 'dog' },
    { key: 'parvovirus', label: 'Parvovirus', category: 'dog' },
    { key: 'parainfluenza', label: 'Parainfluenza', category: 'dog' },
    { key: 'adenovirus', label: 'Adenovirus', category: 'dog' },
    { key: 'bordetella', label: 'Bordetella', category: 'dog' },
    { key: 'lyme', label: 'Lyme', category: 'dog' },
    { key: 'leptospirosis', label: 'Leptospirosis', category: 'dog' },
    // Cats
    { key: 'fvrcp', label: 'FVRCP', category: 'cat' },
    { key: 'panleukopenia', label: 'Panleukopenia', category: 'cat' },
    { key: 'rhinotracheitis', label: 'Rhinotracheitis', category: 'cat' },
    { key: 'calicivirus', label: 'Calicivirus', category: 'cat' },
    { key: 'felv', label: 'FeLV', category: 'cat' },
    // Universal
    { key: 'other', label: 'Other', category: 'all' }
  ]

  const administrationSites = [
    { key: 'left_shoulder', label: 'Left Shoulder' },
    { key: 'right_shoulder', label: 'Right Shoulder' },
    { key: 'left_rear_leg', label: 'Left Rear Leg' },
    { key: 'right_rear_leg', label: 'Right Rear Leg' },
    { key: 'scruff', label: 'Scruff' },
    { key: 'other', label: 'Other' }
  ]

  const fetchPets = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getPets(token)
      if (response.success) {
        setPets(response.pets)
        if (response.pets.length > 0 && !selectedPet) {
          setSelectedPet(response.pets[0])
        }
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    }
  }

  const fetchVaccines = async (petId?: string) => {
    if (!token) return
    
    try {
      if (petId) {
        const response = await apiService.getPetVaccines(token, petId)
        if (response.success) {
          setVaccines(response.vaccines)
        }
      }
    } catch (error) {
      console.error('Error fetching vaccines:', error)
    }
  }

  const fetchUpcomingVaccines = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getUpcomingVaccines(token, 30)
      if (response.success) {
        setUpcomingVaccines(response.vaccines)
      }
    } catch (error) {
      console.error('Error fetching upcoming vaccines:', error)
    }
  }

  const fetchOverdueVaccines = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getOverdueVaccines(token)
      if (response.success) {
        setOverdueVaccines(response.vaccines)
      }
    } catch (error) {
      console.error('Error fetching overdue vaccines:', error)
    }
  }

  const fetchVaccineStats = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getVaccineStats(token)
      if (response.success) {
        setVaccineStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching vaccine stats:', error)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchPets(),
      fetchUpcomingVaccines(),
      fetchOverdueVaccines(),
      fetchVaccineStats()
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [token])

  useEffect(() => {
    if (selectedPet) {
      fetchVaccines(selectedPet.id)
    }
  }, [selectedPet])

  const getPetIcon = (type: string) => {
    const petType = petTypes.find(p => p.key === type)
    return petType?.icon || '🐾'
  }

  const getVaccineStatusColor = (vaccine: PetVaccine) => {
    if (vaccine.isOverdue) return 'bg-red-100 border-red-300 text-red-700'
    if (vaccine.isDueSoon) return 'bg-orange-100 border-orange-300 text-orange-700'
    return 'bg-green-100 border-green-300 text-green-700'
  }

  const getVaccineStatusIcon = (vaccine: PetVaccine) => {
    if (vaccine.isOverdue) return '🚨'
    if (vaccine.isDueSoon) return '⚠️'
    return '✅'
  }

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newPet.name.trim()) return
    
    try {
      const petData = {
        name: newPet.name.trim(),
        type: newPet.type,
        breed: newPet.breed.trim() || undefined,
        birthDate: newPet.birthDate || undefined,
        gender: newPet.gender,
        spayedNeutered: newPet.spayedNeutered,
        weight: newPet.weight.value > 0 ? {
          value: newPet.weight.value,
          unit: newPet.weight.unit
        } : undefined,
        notes: newPet.notes.trim() || undefined
      }

      const response = await apiService.createPet(token, petData)
      
      if (response.success) {
        setPets(prev => [...prev, response.pet])
        setNewPet({
          name: '',
          type: 'dog',
          breed: '',
          birthDate: '',
          gender: 'unknown',
          spayedNeutered: false,
          weight: { value: 0, unit: 'lbs' },
          veterinarian: { name: '', clinic: '', phone: '', email: '', address: '' },
          notes: ''
        })
        setShowAddPetForm(false)
        if (!selectedPet) {
          setSelectedPet(response.pet)
        }
      }
    } catch (error) {
      console.error('Error creating pet:', error)
    }
  }

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedPet || !newVaccine.vaccineName.trim()) return
    
    try {
      const vaccineData = {
        ...newVaccine,
        vaccineName: newVaccine.vaccineName.trim(),
        notes: newVaccine.notes.trim()
      }

      const response = await apiService.createPetVaccine(token, selectedPet.id, vaccineData)
      
      if (response.success) {
        setVaccines(prev => [...prev, response.vaccine])
        setNewVaccine({
          vaccineName: '',
          vaccineType: 'other',
          administeredDate: '',
          expirationDate: '',
          nextDueDate: '',
          veterinarian: { name: '', clinic: '', phone: '', licenseNumber: '' },
          batchLotNumber: '',
          manufacturer: '',
          administrationSite: 'other',
          isCore: false,
          notes: ''
        })
        setShowAddVaccineForm(false)
        fetchAllData() // Refresh all data including stats
      }
    } catch (error) {
      console.error('Error creating vaccine record:', error)
    }
  }

  const handleDeletePet = async (petId: string) => {
    if (!token || !confirm('Are you sure you want to remove this pet?')) return
    
    try {
      const response = await apiService.deletePet(token, petId)
      
      if (response.success) {
        setPets(prev => prev.filter(pet => pet.id !== petId))
        if (selectedPet?.id === petId) {
          const remainingPets = pets.filter(pet => pet.id !== petId)
          setSelectedPet(remainingPets.length > 0 ? remainingPets[0] : null)
        }
        fetchAllData()
      }
    } catch (error) {
      console.error('Error deleting pet:', error)
    }
  }

  const handleDeleteVaccine = async (petId: string, vaccineId: string) => {
    if (!token || !confirm('Are you sure you want to delete this vaccine record?')) return
    
    try {
      const response = await apiService.deletePetVaccine(token, petId, vaccineId)
      
      if (response.success) {
        setVaccines(prev => prev.filter(vaccine => vaccine.id !== vaccineId))
        fetchAllData()
      }
    } catch (error) {
      console.error('Error deleting vaccine record:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pet care data...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-green-400 to-blue-400 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🐾</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pet Care Center</h1>
              <p className="opacity-90">Manage your pets and their health records</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddPetForm(true)}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
            >
              <span>🐕</span>
              <span>Add Pet</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1">
          {[
            { key: 'pets', label: '🐾 My Pets', count: pets.length },
            { key: 'vaccines', label: '💉 Vaccines', count: vaccines.length },
            { key: 'upcoming', label: '📅 Upcoming', count: upcomingVaccines.length },
            { key: 'overdue', label: '🚨 Overdue', count: overdueVaccines.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all font-medium ${
                activeTab === tab.key
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.label.split(' ')[0]}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')} ({tab.count})</span>
              <span className="sm:hidden">({tab.count})</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Vaccine Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{vaccineStats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Vaccines</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{vaccineStats.current}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{vaccineStats.due_soon}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Due Soon</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{vaccineStats.overdue}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
        </Card>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pet List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">My Pets ({pets.length})</h3>
            </div>
            
            {pets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">🐾</div>
                <p>No pets added yet.</p>
                <button
                  onClick={() => setShowAddPetForm(true)}
                  className="mt-2 text-green-500 hover:text-green-600"
                >
                  Add your first pet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pets.map(pet => (
                  <div
                    key={pet.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPet?.id === pet.id
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPet(pet)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPetIcon(pet.type)}</span>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">{pet.name}</h4>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pet.breed && <span>{pet.breed} • </span>}
                            <span className="capitalize">{pet.type}</span>
                            {pet.age && <span> • {pet.age}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePet(pet.id)
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pet Details */}
          {selectedPet && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getPetIcon(selectedPet.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedPet.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 capitalize">{selectedPet.type}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowAddVaccineForm(true)}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  💉 Add Vaccine
                </button>
              </div>

              <div className="space-y-3 text-sm">
                {selectedPet.breed && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Breed:</span>
                    <span>{selectedPet.breed}</span>
                  </div>
                )}
                
                {selectedPet.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Age:</span>
                    <span>{selectedPet.age}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gender:</span>
                  <span className="capitalize">{selectedPet.gender}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Spayed/Neutered:</span>
                  <span>{selectedPet.spayedNeutered ? 'Yes' : 'No'}</span>
                </div>
                
                {selectedPet.weight && selectedPet.weight.value > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Weight:</span>
                    <span>{selectedPet.weight.value} {selectedPet.weight.unit}</span>
                  </div>
                )}
                
                {selectedPet.veterinarian?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Veterinarian:</span>
                    <span>{selectedPet.veterinarian.name}</span>
                  </div>
                )}
                
                {selectedPet.notes && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
                    <p className="text-gray-700 dark:text-gray-300">{selectedPet.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'vaccines' && selectedPet && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Vaccines for {selectedPet.name}</h3>
            <button
              onClick={() => setShowAddVaccineForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              💉 Add Vaccine
            </button>
          </div>
          
          {vaccines.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">💉</div>
              <p>No vaccine records found for {selectedPet.name}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccines.map(vaccine => (
                <div
                  key={vaccine.id}
                  className={`p-4 rounded-lg border ${getVaccineStatusColor(vaccine)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getVaccineStatusIcon(vaccine)}</span>
                      <div>
                        <h4 className="font-medium">{vaccine.vaccineName}</h4>
                        <div className="text-sm opacity-75">
                          Type: {vaccine.vaccineType} • Administered: {formatDate(vaccine.administeredDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm">
                        <div className="font-medium">{getDaysUntilDue(vaccine.nextDueDate)}</div>
                        <div className="opacity-75">Next: {formatDate(vaccine.nextDueDate)}</div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteVaccine(selectedPet.id, vaccine.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {vaccine.notes && (
                    <div className="mt-2 text-sm opacity-75">
                      <strong>Notes:</strong> {vaccine.notes}
                    </div>
                  )}
                  
                  {vaccine.veterinarian?.name && (
                    <div className="mt-1 text-sm opacity-75">
                      <strong>Veterinarian:</strong> {vaccine.veterinarian.name}
                      {vaccine.veterinarian.clinic && ` - ${vaccine.veterinarian.clinic}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'upcoming' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Upcoming Vaccines (Next 30 Days)</h3>
          
          {upcomingVaccines.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📅</div>
              <p>No vaccines due in the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingVaccines.map(vaccine => (
                <div key={vaccine.id} className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPetIcon(vaccine.petType || 'other')}</span>
                      <div>
                        <h4 className="font-medium">{vaccine.petName} - {vaccine.vaccineName}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {vaccine.vaccineType} • Pet: {vaccine.petType}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-orange-700">{getDaysUntilDue(vaccine.nextDueDate)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(vaccine.nextDueDate)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'overdue' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Overdue Vaccines</h3>
          
          {overdueVaccines.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>No overdue vaccines! Your pets are up to date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueVaccines.map(vaccine => (
                <div key={vaccine.id} className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPetIcon(vaccine.petType || 'other')}</span>
                      <div>
                        <h4 className="font-medium">{vaccine.petName} - {vaccine.vaccineName}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {vaccine.vaccineType} • Pet: {vaccine.petType}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-red-700">{vaccine.daysOverdue} days overdue</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Due: {formatDate(vaccine.nextDueDate)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Pet Modal */}
      {showAddPetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Pet</h2>
              <button
                onClick={() => setShowAddPetForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddPet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pet Name</label>
                  <input
                    type="text"
                    value={newPet.name}
                    onChange={(e) => setNewPet(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pet Type</label>
                  <select
                    value={newPet.type}
                    onChange={(e) => setNewPet(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {petTypes.map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Breed (Optional)</label>
                  <input
                    type="text"
                    value={newPet.breed}
                    onChange={(e) => setNewPet(prev => ({ ...prev, breed: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Date (Optional)</label>
                  <input
                    type="date"
                    value={newPet.birthDate}
                    onChange={(e) => setNewPet(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    value={newPet.gender}
                    onChange={(e) => setNewPet(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newPet.spayedNeutered}
                      onChange={(e) => setNewPet(prev => ({ ...prev, spayedNeutered: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Spayed/Neutered</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={newPet.notes}
                  onChange={(e) => setNewPet(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Pet
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPetForm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vaccine Modal */}
      {showAddVaccineForm && selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Vaccine Record for {selectedPet.name}</h2>
              <button
                onClick={() => setShowAddVaccineForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddVaccine} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaccine Name</label>
                  <input
                    type="text"
                    value={newVaccine.vaccineName}
                    onChange={(e) => setNewVaccine(prev => ({ ...prev, vaccineName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaccine Type</label>
                  <select
                    value={newVaccine.vaccineType}
                    onChange={(e) => setNewVaccine(prev => ({ ...prev, vaccineType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {vaccineTypes
                      .filter(type => type.category === 'all' || type.category === selectedPet.type)
                      .map(type => (
                        <option key={type.key} value={type.key}>{type.label}</option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Administered Date</label>
                  <input
                    type="date"
                    value={newVaccine.administeredDate}
                    onChange={(e) => setNewVaccine(prev => ({ ...prev, administeredDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={newVaccine.expirationDate}
                    onChange={(e) => setNewVaccine(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={newVaccine.nextDueDate}
                    onChange={(e) => setNewVaccine(prev => ({ ...prev, nextDueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newVaccine.isCore}
                      onChange={(e) => setNewVaccine(prev => ({ ...prev, isCore: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Core Vaccine</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={newVaccine.notes}
                  onChange={(e) => setNewVaccine(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Vaccine Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVaccineForm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetCare