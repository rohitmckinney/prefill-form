'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormSection } from '@/components/FormSection'
import { FormData } from '@/types/form'
import { generatePDF } from '@/lib/pdf'

export default function HomePage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchMessage, setFetchMessage] = useState<string | null>(null)
  const [smartyData, setSmartyData] = useState<any>(null)
  const [showSidePanelData, setShowSidePanelData] = useState(false)
  const [searchAddress, setSearchAddress] = useState('')
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<FormData>()

  const fetchData = async () => {
    if (!searchAddress || searchAddress.trim() === '') {
      setFetchMessage('Please enter an address first')
      setTimeout(() => setFetchMessage(null), 3000)
      return
    }

    setIsLoading(true)
    setFetchMessage(null)
    setSmartyData(null)
    setShowSidePanelData(false)

    try {
      console.log('🔍 Fetching data for address:', searchAddress)
      
      const response = await fetch('/api/prefill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: searchAddress }),
      })

      const result = await response.json()
      console.log('📊 API Response:', result)

      if (response.ok && result.success) {
        setSmartyData(result)
        setShowSidePanelData(true)
        
        // Check for validation warnings - don't show in temporary message, show in side panel
        if (result.validation && result.validation.warnings && result.validation.warnings.length > 0) {
          // Just show success message - warnings will be displayed in side panel permanently
          setFetchMessage(`✅ Found property data with ${Object.keys(result.data).length} attributes`)
        } else {
          setFetchMessage(`✅ Found property data with ${Object.keys(result.data).length} attributes`)
        }
      } else {
        setFetchMessage(`❌ ${result.message || 'Failed to fetch data'}`)
      }
    } catch (error: any) {
      console.error('❌ Fetch error:', error)
      setFetchMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setFetchMessage(null), 5000)
    }
  }

  const fillFieldsFromSmarty = () => {
    if (!smartyData?.data) return
    
    console.log('🔄 Intelligently filling form fields with Smarty + Google Maps data')
    let filledCount = 0
    
    // === INTELLIGENT FIELD MAPPING ===
    
    // 1. Corporation Name (from owner data)
    if (smartyData.data.corporationName || smartyData.data.ownerFullName || smartyData.data.deedOwnerFullName) {
      const corpName = smartyData.data.corporationName || smartyData.data.ownerFullName || smartyData.data.deedOwnerFullName
      setValue('corporationName', corpName)
      filledCount++
      console.log('✅ Filled: Corporation Name')
    }
    
    // 2. Address (from matched address)
    if (smartyData.data.address) {
      setValue('address', smartyData.data.address)
      filledCount++
      console.log('✅ Filled: Address')
    }
    
    // 3. Operation Description (from Google Maps business types or land use)
    if (smartyData.data.operationDescription) {
      // Use the smart-formatted operation description from backend
      setValue('operationDescription', smartyData.data.operationDescription)
      filledCount++
      console.log('✅ Filled: Operation Description')
    } else if (smartyData.data.businessTypes || smartyData.data.landUseStandard) {
      const opDesc = smartyData.data.businessTypes || 
                     (smartyData.data.landUseStandard ? smartyData.data.landUseStandard.replace(/_/g, ' ').toUpperCase() : '')
      setValue('operationDescription', opDesc)
      filledCount++
      console.log('✅ Filled: Operation Description')
    }
    
    // 4. DBA (from Google Maps business name or legal description)
    if (smartyData.data.dba || smartyData.data.businessName || smartyData.data.legalDescription) {
      setValue('dba', smartyData.data.dba || smartyData.data.businessName || smartyData.data.legalDescription)
      filledCount++
      console.log('✅ Filled: DBA')
    }

    // 4b. Contact Number (from Google Maps)
    if (smartyData.data.contactNumber || smartyData.data.phoneNumber) {
      setValue('contactNumber', smartyData.data.contactNumber || smartyData.data.phoneNumber)
      filledCount++
      console.log('✅ Filled: Contact Number')
    }

    // 4c. Hours of Operation (from Google Maps - simplified to just the number)
    if (smartyData.data.hoursOfOperation) {
      setValue('hoursOfOperation', smartyData.data.hoursOfOperation)
      filledCount++
      console.log('✅ Filled: Hours of Operation')
    }
    
    // 5. Year Built
    if (smartyData.data.yearBuilt) {
      setValue('yearBuilt', smartyData.data.yearBuilt)
      filledCount++
      console.log('✅ Filled: Year Built')
    }
    
    // 6. Construction Type
    if (smartyData.data.constructionType || smartyData.data.construction_type || smartyData.data.exteriorWalls) {
      const constructionType = smartyData.data.constructionType || 
                               smartyData.data.construction_type || 
                               smartyData.data.exteriorWalls
      setValue('constructionType', String(constructionType).replace(/_/g, ' ').toUpperCase())
      filledCount++
      console.log('✅ Filled: Construction Type')
    }
    
    // 7. Total Square Footage
    if (smartyData.data.totalSqFootage || smartyData.data.buildingSqft || smartyData.data.building_sqft) {
      const sqft = smartyData.data.totalSqFootage || smartyData.data.buildingSqft || smartyData.data.building_sqft
      setValue('totalSqFootage', String(sqft))
      filledCount++
      console.log('✅ Filled: Total Sq. Footage')
    }
    
    // 8. Applicant Type (derive from ownership type)
    if (smartyData.data.applicantType) {
      setValue('applicantType', smartyData.data.applicantType)
      filledCount++
      console.log('✅ Filled: Applicant Type')
    } else if (smartyData.data.ownershipType) {
      // Map ownership type to applicant type
      const ownershipMap: Record<string, string> = {
        'company': 'corporation',
        'corporate': 'corporation',
        'llc': 'llc',
        'individual': 'individual',
        'partnership': 'partnership'
      }
      const mapped = ownershipMap[smartyData.data.ownershipType.toLowerCase()] || 'other'
      setValue('applicantType', mapped)
      filledCount++
      console.log('✅ Filled: Applicant Type (derived)')
    }
    
    // 9. Building Coverage (from assessed value)
    if (smartyData.data.assessedValue || smartyData.data.assessed_improvement_value) {
      const buildingValue = smartyData.data.assessedValue || smartyData.data.assessed_improvement_value
      setValue('building', String(buildingValue))
      filledCount++
      console.log('✅ Filled: Building Coverage')
    }
    
    // 10. Canopy Coverage (from canopy sqft)
    if (smartyData.data.canopy || smartyData.data.canopySqft) {
      if (smartyData.data.canopySqft) {
        const canopyValue = parseInt(smartyData.data.canopySqft) * 200 // $200 per sqft estimate
        setValue('canopy', String(canopyValue))
        filledCount++
        console.log('✅ Filled: Canopy Coverage (calculated)')
      }
    }
    
    // 12. Number of Buildings (info - could show in anyLeasedOutSpace if > 1)
    if (smartyData.data.numberOfBuildings && parseInt(smartyData.data.numberOfBuildings) > 1) {
      setValue('anyLeasedOutSpace', `${smartyData.data.numberOfBuildings} buildings on property`)
      filledCount++
      console.log('✅ Filled: Leased Space Info (multiple buildings)')
    }
    
    // 13. Burglar Alarm (from security_alarm)
    if (smartyData.data.security_alarm) {
      const hasAlarm = String(smartyData.data.security_alarm).toLowerCase().includes('yes') || 
                       String(smartyData.data.security_alarm).toLowerCase().includes('true')
      if (hasAlarm) {
        setValue('burglarAlarm.centralStation', true)
        filledCount++
        console.log('✅ Filled: Burglar Alarm - Central Station')
      }
    }
    
    // 14. Fire Alarm (from fire_sprinklers_flag or sprinklers)
    if (smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers) {
      const hasSprinklers = String(smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers)
                           .toLowerCase().includes('yes') || 
                           String(smartyData.data.fire_sprinklers_flag || smartyData.data.sprinklers)
                           .toLowerCase().includes('true')
      if (hasSprinklers) {
        setValue('fireAlarm.centralStation', true)
        filledCount++
        console.log('✅ Filled: Fire Alarm - Central Station (has sprinklers)')
      }
    }
    
    // 15. Protection Class (from fire_resistance_code)
    if (smartyData.data.fire_resistance_code) {
      setValue('protectionClass', smartyData.data.fire_resistance_code)
      filledCount++
      console.log('✅ Filled: Protection Class')
    }

    // 16. Additional Insured (from lender/mortgage info)
    if (smartyData.data.additionalInsured) {
      setValue('additionalInsured', smartyData.data.additionalInsured)
      filledCount++
      console.log('✅ Filled: Additional Insured (Lender/Mortgagee)')
    }
    
    // === DIRECT MAPPINGS (if exact field names exist) ===
    const directMappings: Array<keyof FormData> = [
      'yearOfLatestUpdate',
      'hoursOfOperation',
      'noOfMPDs',
      'yearsInBusiness',
      'yearsAtLocation',
      'fein',
      'protectionClass',
      'noOfEmployees',
      'payroll',
      'officersInclExcl',
      'ownership'
    ]
    
    directMappings.forEach(fieldName => {
      if (smartyData.data[fieldName] && smartyData.data[fieldName] !== '') {
        setValue(fieldName, smartyData.data[fieldName])
        filledCount++
        console.log(`✅ Filled: ${fieldName}`)
      }
    })
    
    console.log(`🎉 Successfully filled ${filledCount} form fields!`)
    setFetchMessage(`✅ Intelligently auto-filled ${filledCount} form fields from property data!`)
    setTimeout(() => setFetchMessage(null), 5000)
  }

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data)
    setSubmittedData(data)
    setIsSubmitted(true)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const downloadPDF = () => {
    if (submittedData) {
      console.log('Downloading PDF with data:', submittedData)
      const pdf = generatePDF(submittedData)
      pdf.save('convenience-store-application.pdf')
    }
  }

  const resetForm = () => {
    reset()
    setIsSubmitted(false)
    setSubmittedData(null)
    setShowSuccess(false)
    setShowSidePanelData(false)
    setSmartyData(null)
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, fieldName: keyof FormData) => {
    e.preventDefault()
    
    // Try to get data from the global variable (more reliable than dataTransfer)
    const draggedData = (window as any).draggedSmartyData
    
    if (draggedData && draggedData.value) {
      setValue(fieldName, draggedData.value as any)
      setFetchMessage(`✅ Filled "${fieldName}" with: ${draggedData.value}`)
      setTimeout(() => setFetchMessage(null), 3000)
    } else {
      // Fallback to dataTransfer
      const data = e.dataTransfer.getData('text/plain')
      if (data) {
        setValue(fieldName, data as any)
        setFetchMessage(`✅ Filled "${fieldName}" with: ${data}`)
        setTimeout(() => setFetchMessage(null), 3000)
      }
    }
  }

  // Drag and drop form field component
  const DragDropFormField = ({ 
    name, 
    label, 
    placeholder, 
    type = 'text', 
    multiline = false,
    required = false 
  }: {
    name: keyof FormData
    label: string
    placeholder?: string
    type?: string
    multiline?: boolean
    required?: boolean
  }) => {
    const [isDragOver, setIsDragOver] = useState(false)
    
    const fieldProps = {
      ...register(name, required ? { required: `${label} is required` } : {}),
      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        isDragOver ? 'border-blue-500 bg-blue-50' : ''
      }`,
      placeholder: placeholder || '',
      onDragOver: (e: React.DragEvent) => {
        handleDragOver(e)
        setIsDragOver(true)
      },
      onDragLeave: () => setIsDragOver(false),
      onDrop: (e: React.DragEvent) => {
        handleDrop(e, name)
        setIsDragOver(false)
      }
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {isDragOver && (
            <span className="ml-2 text-blue-600 text-xs animate-pulse">Drop here!</span>
          )}
        </label>
        {multiline ? (
          <textarea rows={3} {...fieldProps} />
        ) : (
          <input type={type} {...fieldProps} />
        )}
        {errors[name] && (
          <p className="text-red-600 text-sm mt-1">{(errors[name] as any)?.message}</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header matching PDF */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mckinney & Co. Insurance</h1>
          <h2 className="text-xl font-semibold text-gray-600">Convenience Store Application</h2>
        </div>
        
        {/* Test the side panel structure */}
        <div className="flex gap-8 relative min-h-[calc(100vh-200px)]">
          <div className={`transition-all duration-300 ${showSidePanelData ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div className="bg-white p-6 rounded-lg shadow">
              
              {!isSubmitted ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6">Convenience Store Insurance Application</h2>
                  
                  {/* Address Search Section */}
                  <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">🏢 Property Address Lookup</h3>
                    <div className="flex gap-4">
                      <input
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Enter property address (e.g., 526 Flint River Rd, Jonesboro, GA)"
                      />
                      <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Fetch Data</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Fetch Status Message */}
                    {fetchMessage && (
                      <div className={`mt-4 p-3 rounded-md text-sm ${
                        fetchMessage.includes('✅') 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {fetchMessage}
                      </div>
                    )}
                  </div>

                  {/* Data Validation Warning - Only show for FAILED validation */}
                  {showSidePanelData && smartyData?.validation && !smartyData.validation.isValid && smartyData.validation.warnings && smartyData.validation.warnings.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-red-800 font-bold text-lg">⚠️ DATA VERIFICATION REQUIRED</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        {smartyData.validation.warnings.map((warning: string, idx: number) => (
                          <p key={idx} className="text-red-700 font-medium">{warning}</p>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                        <p className="text-red-900 font-semibold text-sm">
                          🔍 AGENT ACTION REQUIRED: The automated data sources may have outdated or incorrect information. 
                          Please manually verify all fields below, especially:
                        </p>
                        <ul className="mt-2 ml-4 text-red-800 text-sm list-disc space-y-1">
                          <li>Business name and type (is this actually a convenience store/gas station?)</li>
                          <li>Current owner and contact information</li>
                          <li>Hours of operation and business status</li>
                          <li>Property usage and occupancy</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Informational Messages - Only show for VALID properties with info */}
                  {showSidePanelData && smartyData?.validation?.isValid && smartyData.validation.info && smartyData.validation.info.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-800 font-semibold">ℹ️ Information</span>
                      </div>
                      <div className="ml-7 space-y-1">
                        {smartyData.validation.info.map((info: string, idx: number) => (
                          <p key={idx} className="text-blue-700 text-sm">{info}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drag and Drop Instructions */}
                  {showSidePanelData && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-yellow-800 font-medium">Drag & Drop Enabled!</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Drag any field from the side panel and drop it onto the form fields below to auto-fill them.
                      </p>
                    </div>
                  )}

                  {/* Comprehensive Insurance Application Form - Compact Layout */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    
                    {/* Row 1: Corporation Name + Contact Name + Contact Number */}
                    <div className="grid grid-cols-3 gap-3">
                      <DragDropFormField 
                        name="corporationName" 
                        label="Corporation Name" 
                        placeholder="Enter corporation name"
                        required
                      />
                      <DragDropFormField 
                        name="contactName" 
                        label="Contact Name" 
                        placeholder="Enter contact name"
                        required
                      />
                      <DragDropFormField 
                        name="contactNumber" 
                        label="Contact Number" 
                        placeholder="Enter contact number"
                        required
                      />
                    </div>

                    {/* Row 2: Contact Email + Proposed Date + Prior Carrier + Target Premium */}
                    <div className="grid grid-cols-4 gap-3">
                      <DragDropFormField 
                        name="contactEmail" 
                        label="Contact Email" 
                        placeholder="Enter email address"
                        type="email"
                        required
                      />
                      <DragDropFormField 
                        name="proposedEffectiveDate" 
                        label="Proposed Effective Date" 
                        type="date"
                      />
                      <DragDropFormField 
                        name="priorCarrier" 
                        label="Prior Carrier" 
                        placeholder="Enter prior carrier"
                      />
                      <DragDropFormField 
                        name="targetPremium" 
                        label="Target Premium" 
                        placeholder="Enter target premium"
                      />
                    </div>

                    {/* Row 3: Applicant Type (Inline Radio Buttons) */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicant is
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'individual', label: 'Individual' },
                          { value: 'partnership', label: 'Partnership' },
                          { value: 'corporation', label: 'Corporation' },
                          { value: 'jointVenture', label: 'Joint Venture' },
                          { value: 'llc', label: 'LLC' },
                          { value: 'other', label: 'other' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...register('applicantType', { required: 'Please select applicant type' })}
                              value={option.value}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.applicantType && (
                        <p className="text-red-600 text-xs mt-1">{errors.applicantType.message}</p>
                      )}
                    </div>

                    {/* Row 4: Ownership Type (Inline Radio Buttons) */}
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'owner', label: 'Owner' },
                          { value: 'tenant', label: 'Tenant' },
                          { value: 'lessorsRisk', label: "Lessor's Risk" },
                          { value: 'tripleNetLease', label: 'Triple Net Lease' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...register('ownershipType')}
                              value={option.value}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Row 5: Operation Description + DBA */}
                    <div className="grid grid-cols-2 gap-3">
                      <DragDropFormField 
                        name="operationDescription" 
                        label="Operation Description:" 
                        placeholder="Describe your business operations..."
                        multiline
                      />
                      <div className="space-y-3">
                        <DragDropFormField 
                          name="dba" 
                          label="DBA" 
                          placeholder="Enter DBA (Doing Business As)"
                        />
                        <DragDropFormField 
                          name="address" 
                          label="Address" 
                          placeholder="Enter property address"
                        />
                      </div>
                    </div>

                    {/* Row 6: Hours + MPDs + Construction Type + Years in Business */}
                    <div className="grid grid-cols-4 gap-3">
                      <DragDropFormField 
                        name="hoursOfOperation" 
                        label="Hours of operation" 
                        placeholder="Enter hours"
                      />
                      <DragDropFormField 
                        name="noOfMPDs" 
                        label="No. Of MPDs" 
                        placeholder="Enter number"
                      />
                      <DragDropFormField 
                        name="constructionType" 
                        label="Construction type :" 
                        placeholder="Enter type"
                      />
                      <DragDropFormField 
                        name="yearsInBusiness" 
                        label="Years Exp. in business" 
                        placeholder="Enter years"
                      />
                    </div>

                    {/* Row 7: Years at Location + Year Built + Year Update + Total Sq Footage + Leased Space */}
                    <div className="grid grid-cols-5 gap-3">
                      <DragDropFormField 
                        name="yearsAtLocation" 
                        label="Years at this Location" 
                        placeholder="Enter years"
                      />
                      <DragDropFormField 
                        name="yearBuilt" 
                        label="Year built" 
                        placeholder="Year"
                      />
                      <DragDropFormField 
                        name="yearOfLatestUpdate" 
                        label="Year of latest update" 
                        placeholder="Year"
                      />
                      <DragDropFormField 
                        name="totalSqFootage" 
                        label="Total sq. Footage" 
                        placeholder="Sq ft"
                      />
                      <DragDropFormField 
                        name="anyLeasedOutSpace" 
                        label="Any leased out space :" 
                        placeholder="Yes/No"
                      />
                    </div>

                    {/* Row 8: Protection Class + Additional Insured */}
                    <div className="grid grid-cols-2 gap-3">
                      <DragDropFormField 
                        name="protectionClass" 
                        label="Protection Class:" 
                        placeholder="Enter protection class"
                      />
                      <DragDropFormField 
                        name="additionalInsured" 
                        label="Additional Insured:" 
                        placeholder="Enter additional insured"
                      />
                    </div>

                    {/* Row 9: Alarm (Compact Inline) */}
                    <div className="border border-gray-300 p-2 rounded">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">Alarm:</span>
                        <span className="text-gray-700">Burglar</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('burglarAlarm.centralStation')}
                            className="mr-1"
                          />
                          <span>Central Station</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('burglarAlarm.local')}
                            className="mr-1"
                          />
                          <span>Local</span>
                        </label>
                        <span className="text-gray-700 ml-4">Fire</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('fireAlarm.centralStation')}
                            className="mr-1"
                          />
                          <span>Central Station</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('fireAlarm.local')}
                            className="mr-1"
                          />
                          <span>Local</span>
                        </label>
                      </div>
                    </div>

                    {/* 10. Combined Table: Property Section + General Liability + Worker's Compensation (Compact) */}
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        {/* Table Headers */}
                        <thead>
                          <tr className="bg-gray-100">
                            <th colSpan={2} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              Property Section
                            </th>
                            <th colSpan={3} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              GENERAL LIABILITY (Exposure)
                            </th>
                            <th className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 text-xs">
                              Worker's Compensation
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Coverage</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Limits</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs"></th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Monthly</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs">Yearly</th>
                            <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 text-xs"></th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {/* Row 1: Building / Inside Sales Total / FEIN */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Building</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('building')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'building')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Inside Sales Total</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('insideSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'insideSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('insideSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'insideSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('fein')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'fein')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="FEIN"
                              />
                            </td>
                          </tr>

                          {/* Row 2: BPP / Liquor Sales / No. of Employees */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">BPP</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('bpp')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'bpp')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Liquor Sales</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('liquorSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'liquorSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('liquorSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'liquorSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('noOfEmployees')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'noOfEmployees')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="No. of Employees"
                              />
                            </td>
                          </tr>

                          {/* Row 3: B I / Gasoline Sales / Payroll */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">B I</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('bi')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'bi')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Gasoline Sales</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('gasSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'gasSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('gasSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'gasSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('payroll')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'payroll')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="Payroll"
                              />
                            </td>
                          </tr>

                          {/* Row 4: Canopy / Propane filling/Exchange / Incl/Excl officers */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Canopy</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('canopy')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'canopy')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Propane filling/Exchange</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('propaneSalesMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'propaneSalesMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('propaneSalesYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'propaneSalesYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('officersInclExcl')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'officersInclExcl')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="Incl/Excl"
                              />
                            </td>
                          </tr>

                          {/* Row 5: Pumps / Carwash / % Ownership */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Pumps</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('pumps')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'pumps')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Carwash</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('carwashMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'carwashMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('carwashYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'carwashYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('ownership')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'ownership')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="% Ownership"
                              />
                            </td>
                          </tr>

                          {/* Row 6: M&S / Cooking / Empty */}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">M&S</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('ms')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'ms')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Cooking</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('cookingMonthly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'cookingMonthly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                {...register('cookingYearly')}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'cookingYearly')}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                placeholder="$"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1 bg-gray-50">
                              {/* Empty cell */}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-between items-center pt-6">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Reset Form
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Submit Application</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Thank you for submitting your convenience store application. Our team will review it and get back to you soon.
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={downloadPDF}
                      className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Download Filled PDF
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Start New Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Unified Comprehensive Data Panel */}
          {showSidePanelData && smartyData && (
            <div className="w-1/2 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto max-h-screen">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Complete Property Data</h2>
                  <button
                    onClick={() => setShowSidePanelData(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* All Data in One Organized View */}
                <div className="space-y-4">
                  
                  {/* Validation Warnings Alert - Only show when validation fails or has warnings */}
                  {smartyData.validation && !smartyData.validation.isValid && smartyData.validation.warnings && smartyData.validation.warnings.length > 0 && (
                    <div className="p-4 rounded-lg border-2 bg-red-50 border-red-400">
                      <div className="flex items-start">
                        <div className="text-2xl mr-3 text-red-600">🚫</div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-2 text-red-800">
                            Property Validation Failed
                          </h3>
                          <ul className="space-y-1">
                            {smartyData.validation.warnings.map((warning: string, index: number) => (
                              <li key={index} className="text-sm flex items-start text-red-700">
                                <span className="mr-2">•</span>
                                <span className="flex-1">{warning}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {/* Property Metrics */}
                          <div className="mt-3 pt-3 border-t border-red-300">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Building Sq Ft:</span>
                                <span className={`ml-1 ${smartyData.data.buildingSqft && parseInt(smartyData.data.buildingSqft) <= 10 ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                  {smartyData.data.buildingSqft || 'N/A'}
                                </span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Land Use:</span>
                                <span className={`ml-1 ${smartyData.data.landUseStandard?.toLowerCase().includes('vacant') ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                  {smartyData.data.landUseStandard ? smartyData.data.landUseStandard.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                                </span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Property Type:</span>
                                <span className="ml-1 text-gray-900">{smartyData.validation.propertyType.replace('_', ' ').toUpperCase()}</span>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-semibold text-gray-700">Confidence:</span>
                                <span className={`ml-1 font-semibold ${
                                  smartyData.validation.confidence === 'high' ? 'text-green-700' :
                                  smartyData.validation.confidence === 'medium' ? 'text-yellow-700' :
                                  'text-red-700'
                                }`}>
                                  {smartyData.validation.confidence.toUpperCase()}
                                </span>
                              </div>
                              {smartyData.data.yearBuilt && (
                                <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                  <span className="font-semibold text-gray-700">Year Built:</span>
                                  <span className="ml-1 text-gray-900">{smartyData.data.yearBuilt}</span>
                                </div>
                              )}
                              {smartyData.data.assessedValue && (
                                <div className="bg-white bg-opacity-50 rounded px-2 py-1">
                                  <span className="font-semibold text-gray-700">Assessed Value:</span>
                                  <span className="ml-1 text-gray-900">${parseInt(smartyData.data.assessedValue).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Helper function to render draggable field */}
                  {(() => {
                    const DraggableField = ({ label, value, bgColor = 'bg-blue-100' }: { label: string, value: any, bgColor?: string }) => {
                      if (!value || value === '') return null;
                      return (
                        <div className="flex justify-between items-start gap-2 py-1">
                          <span className="font-medium text-gray-600 text-xs">{label}:</span>
                          <span 
                            className={`text-gray-800 cursor-move hover:${bgColor} px-2 py-1 rounded text-xs font-mono flex-1 text-right`}
                            draggable
                            title={`Drag to fill: ${value}`}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(value));
                              (window as any).draggedSmartyData = { label, value: String(value) };
                            }}
                          >
                            {String(value)}
                          </span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* 1. ADDRESS INFORMATION */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h3 className="text-sm font-bold text-blue-900 mb-2">📍 ADDRESS INFORMATION</h3>
                          <div className="space-y-1">
                            {smartyData.data.matchedAddress && (
                              <>
                                <DraggableField 
                                  label="Street" 
                                  value={smartyData.data.matchedAddress.street} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="City" 
                                  value={smartyData.data.matchedAddress.city} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="State" 
                                  value={smartyData.data.matchedAddress.state} 
                                  bgColor="bg-blue-200"
                                />
                                <DraggableField 
                                  label="ZIP Code" 
                                  value={smartyData.data.matchedAddress.zipcode} 
                                  bgColor="bg-blue-200"
                                />
                              </>
                            )}
                            <DraggableField 
                              label="Full Address" 
                              value={smartyData.data.address} 
                              bgColor="bg-blue-200"
                            />
                          </div>
                        </div>

                        {/* 2. MAILING ADDRESS */}
                        {smartyData.data.fullMailingAddress && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <h3 className="text-sm font-bold text-purple-900 mb-2">📬 MAILING ADDRESS</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Full Mailing Address" 
                                value={smartyData.data.fullMailingAddress} 
                                bgColor="bg-purple-200"
                              />
                              {smartyData.data.mailingAddress && (
                                <>
                                  <DraggableField 
                                    label="Mailing City" 
                                    value={smartyData.data.mailingAddress.city} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing State" 
                                    value={smartyData.data.mailingAddress.state} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing ZIP" 
                                    value={smartyData.data.mailingAddress.zipcode} 
                                    bgColor="bg-purple-200"
                                  />
                                  <DraggableField 
                                    label="Mailing County" 
                                    value={smartyData.data.mailingAddress.county} 
                                    bgColor="bg-purple-200"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. OWNER & DEED INFORMATION */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h3 className="text-sm font-bold text-green-900 mb-2">👤 OWNER & DEED INFORMATION</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Deed Owner Full Name" 
                              value={smartyData.data.deedOwnerFullName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Deed Owner Last Name" 
                              value={smartyData.data.deedOwnerLastName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Owner Full Name" 
                              value={smartyData.data.ownerFullName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Corporation Name" 
                              value={smartyData.data.corporationName} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Owner Occupancy Status" 
                              value={smartyData.data.ownerOccupancyStatus} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Ownership Type" 
                              value={smartyData.data.ownershipType} 
                              bgColor="bg-green-200"
                            />
                            <DraggableField 
                              label="Company Flag" 
                              value={smartyData.data.companyFlag} 
                              bgColor="bg-green-200"
                            />
                          </div>
                        </div>

                        {/* 3b. MORTGAGE & LENDER INFORMATION */}
                        {(smartyData.data.lenderName || smartyData.data.mortgageAmount) && (
                          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                            <h3 className="text-sm font-bold text-teal-900 mb-2">💰 MORTGAGE & LENDER INFORMATION</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Lender Name" 
                                value={smartyData.data.lenderName} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Amount" 
                                value={smartyData.data.mortgageAmount ? `$${parseInt(smartyData.data.mortgageAmount).toLocaleString()}` : ''} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Due Date" 
                                value={smartyData.data.mortgageDueDate} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Recording Date" 
                                value={smartyData.data.mortgageRecordingDate} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Term" 
                                value={smartyData.data.mortgageTerm ? `${smartyData.data.mortgageTerm} ${smartyData.data.mortgageTermType || 'months'}` : ''} 
                                bgColor="bg-teal-200"
                              />
                              <DraggableField 
                                label="Mortgage Type" 
                                value={smartyData.data.mortgageType} 
                                bgColor="bg-teal-200"
                              />
                              {smartyData.data.additionalInsured && (
                                <div className="mt-2 pt-2 border-t border-teal-300">
                                  <DraggableField 
                                    label="Additional Insured (Auto-Generated)" 
                                    value={smartyData.data.additionalInsured} 
                                    bgColor="bg-teal-300"
                                  />
                                  <p className="text-xs text-teal-700 mt-1 italic">
                                    ↑ Drag this to "Additional Insured" field in the form
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4. BUILDING & PROPERTY DETAILS */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <h3 className="text-sm font-bold text-orange-900 mb-2">🏢 BUILDING & PROPERTY DETAILS</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Building Sq Ft" 
                              value={smartyData.data.buildingSqft} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Assessed Value" 
                              value={smartyData.data.assessedValue} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Year Built" 
                              value={smartyData.data.yearBuilt} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Stories Number" 
                              value={smartyData.data.storiesNumber} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Number of Buildings" 
                              value={smartyData.data.numberOfBuildings} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Elevation (Feet)" 
                              value={smartyData.data.elevationFeet} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Exterior Walls" 
                              value={smartyData.data.exteriorWalls} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Flooring" 
                              value={smartyData.data.flooring} 
                              bgColor="bg-orange-200"
                            />
                            <DraggableField 
                              label="Construction Type" 
                              value={smartyData.data.construction_type} 
                              bgColor="bg-orange-200"
                            />
                          </div>
                        </div>

                        {/* 5. CANOPY INFORMATION (for gas stations/c-stores) */}
                        {(smartyData.data.canopy || smartyData.data.canopySqft) && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <h3 className="text-sm font-bold text-yellow-900 mb-2">⛽ CANOPY INFORMATION</h3>
                            <div className="space-y-1">
                              <DraggableField 
                                label="Canopy Status" 
                                value={smartyData.data.canopy} 
                                bgColor="bg-yellow-200"
                              />
                              <DraggableField 
                                label="Canopy Sq Ft" 
                                value={smartyData.data.canopySqft} 
                                bgColor="bg-yellow-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* 6. LAND USE & LEGAL */}
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                          <h3 className="text-sm font-bold text-indigo-900 mb-2">📜 LAND USE & LEGAL</h3>
                          <div className="space-y-1">
                            <DraggableField 
                              label="Land Use Group" 
                              value={smartyData.data.landUseGroup} 
                              bgColor="bg-indigo-200"
                            />
                            <DraggableField 
                              label="Land Use Standard" 
                              value={smartyData.data.landUseStandard} 
                              bgColor="bg-indigo-200"
                            />
                            <DraggableField 
                              label="Legal Description" 
                              value={smartyData.data.legalDescription} 
                              bgColor="bg-indigo-200"
                            />
                          </div>
                        </div>

                        {/* 7. ALL OTHER DYNAMIC ATTRIBUTES */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                          <h3 className="text-sm font-bold text-gray-900 mb-2">📋 ALL OTHER ATTRIBUTES ({Object.keys(smartyData.data).filter(k => {
                            const v = smartyData.data[k];
                            return v !== null && v !== undefined && v !== '' && typeof v !== 'object';
                          }).length})</h3>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {Object.entries(smartyData.data)
                              .filter(([key, value]) => 
                                value !== null && 
                                value !== undefined && 
                                value !== '' && 
                                typeof value !== 'object'
                              )
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, value]) => (
                                <DraggableField 
                                  key={key}
                                  label={key.replace(/([A-Z_])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                  value={value}
                                  bgColor="bg-gray-200"
                                />
                              ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Fill All Button */}
                  <button
                    onClick={fillFieldsFromSmarty}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Fill All Available Form Fields ({Object.keys(smartyData.data).length} attributes)
                  </button>
                </div>

                {/* 3D Interactive Street View Map */}
                {smartyData.data.mapEmbedUrl && (
                  <div className="mt-6 p-4 bg-blue-50 border-t border-blue-200">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">🗺️ Interactive 3D Street View</h3>
                      <p className="text-sm text-blue-700">
                        Drag to look around 360°, click arrows to move, zoom in/out to explore. Use this to count fuel dispensers (MPDs).
                      </p>
                    </div>
                    
                    <div className="rounded-lg overflow-hidden border-2 border-blue-400 shadow-lg">
                      <iframe
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={smartyData.data.mapEmbedUrl}
                      />
                    </div>

                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-semibold text-green-800 mb-2 text-sm">🎯 How to Count MPDs:</h4>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• <strong>Ignore</strong> the tall pylon sign (pricing billboard)</li>
                        <li>• <strong>Find the canopy</strong> (horizontal roof over pumps)</li>
                        <li>• <strong>Count rectangular islands</strong> under the canopy</li>
                        <li>• Each island = 1 MPD (Motor Fuel Pump Dispenser)</li>
                        <li>• <strong>Drag</strong> to rotate view, <strong>click arrows</strong> to move around</li>
                      </ul>
                    </div>

                    {/* MPD Counter - Easy Selection */}
                    <div className="mt-4 bg-white border-2 border-blue-300 rounded-lg p-4 shadow-md">
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        🔢 Number of MPDs
                      </label>
                      <select
                        value={watch('noOfMPDs') || ''}
                        onChange={(e) => setValue('noOfMPDs', e.target.value)}
                        className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <option value="">Select number of MPDs...</option>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num} className="text-lg">
                            {num} MPD{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Count the fuel pump islands visible in the Street View above
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}