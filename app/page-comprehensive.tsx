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
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<FormData>()

  const watchedAddress = watch('address')

  const fetchData = async () => {
    if (!watchedAddress || watchedAddress.trim() === '') {
      setFetchMessage('Please enter an address first')
      setTimeout(() => setFetchMessage(null), 3000)
      return
    }

    setIsLoading(true)
    setFetchMessage(null)
    setSmartyData(null)
    setShowSidePanelData(false)

    try {
      console.log('🔍 Fetching data for address:', watchedAddress)
      
      const response = await fetch('/api/prefill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: watchedAddress }),
      })

      const result = await response.json()
      console.log('📊 API Response:', result)

      if (response.ok && result.success) {
        setSmartyData(result)
        setShowSidePanelData(true)
        setFetchMessage(`✅ Found property data with ${Object.keys(result.data).length} attributes`)
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
    
    console.log('🔄 Filling form fields with Smarty data')
    
    // Auto-fill the form fields with received data
    Object.entries(smartyData.data).forEach(([key, value]) => {
      if (value && value !== '' && typeof value === 'string') {
        // Type-safe setValue call for known form fields
        const formDataKeys = [
          'corporationName', 'address', 'operationDescription', 'yearBuilt', 
          'totalSqFootage', 'constructionType', 'ownershipType', 'applicantType',
          'contactName', 'contactNumber', 'contactEmail', 'fein', 'dba',
          'hoursOfOperation', 'noOfMPDs', 'yearsInBusiness', 'yearsAtLocation'
        ]
        
        if (formDataKeys.includes(key)) {
          setValue(key as keyof FormData, value as any)
        }
      }
    })
    
    setFetchMessage(`✅ Auto-filled ${Object.keys(smartyData.data).length} fields successfully!`)
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
        <h1 className="text-3xl font-bold text-center mb-8">Insurance Form with Smarty Integration</h1>
        
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
                        {...register('address')}
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

                  {/* Comprehensive Insurance Application Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* Company Information */}
                    <FormSection title="Company Information">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DragDropFormField 
                          name="corporationName" 
                          label="Corporation Name *" 
                          placeholder="Enter corporation name"
                          required
                        />
                        <DragDropFormField 
                          name="contactName" 
                          label="Contact Name *" 
                          placeholder="Enter contact name"
                          required
                        />
                        <DragDropFormField 
                          name="contactNumber" 
                          label="Contact Number *" 
                          placeholder="Enter contact number"
                          required
                        />
                        <DragDropFormField 
                          name="contactEmail" 
                          label="Contact Email *" 
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
                    </FormSection>

                    {/* Applicant Type */}
                    <FormSection title="Applicant Type">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { value: 'individual', label: 'Individual' },
                          { value: 'partnership', label: 'Partnership' },
                          { value: 'corporation', label: 'Corporation' },
                          { value: 'jointVenture', label: 'Joint Venture' },
                          { value: 'llc', label: 'LLC' },
                          { value: 'other', label: 'Other' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...register('applicantType', { required: 'Please select applicant type' })}
                              value={option.value}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.applicantType && (
                        <p className="text-red-600 text-sm mt-1">{errors.applicantType.message}</p>
                      )}
                    </FormSection>

                    {/* Security Systems */}
                    <FormSection title="Security Systems">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Burglar Alarm</h4>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('burglarAlarm.centralStation')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Central Station</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('burglarAlarm.local')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Local</span>
                            </label>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Fire Alarm</h4>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('fireAlarm.centralStation')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Central Station</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('fireAlarm.local')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Local</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </FormSection>

                    {/* Operations */}
                    <FormSection title="Operations">
                      <DragDropFormField 
                        name="operationDescription" 
                        label="Operation Description" 
                        placeholder="Describe your business operations..."
                        multiline
                      />
                    </FormSection>

                    {/* Ownership */}
                    <FormSection title="Ownership">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: 'owner', label: 'Owner' },
                          { value: 'tenant', label: 'Tenant' },
                          { value: 'lessorsRisk', label: "Lessor's Risk" },
                          { value: 'tripleNetLease', label: 'Triple Net Lease' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...register('ownershipType', { required: 'Please select ownership type' })}
                              value={option.value}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.ownershipType && (
                        <p className="text-red-600 text-sm mt-1">{errors.ownershipType.message}</p>
                      )}
                    </FormSection>

                    {/* Property Coverage */}
                    <FormSection title="Property Coverage">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'building', label: 'Building' },
                          { name: 'bpp', label: 'Business Personal Property (BPP)' },
                          { name: 'bi', label: 'Business Income (BI)' },
                          { name: 'canopy', label: 'Canopy' },
                          { name: 'pumps', label: 'Pumps' },
                          { name: 'ms', label: 'Machinery & Equipment (M&S)' }
                        ].map((field) => (
                          <DragDropFormField 
                            key={field.name}
                            name={field.name as keyof FormData}
                            label={field.label}
                            placeholder={`Enter ${field.label.toLowerCase()} limit`}
                          />
                        ))}
                      </div>
                    </FormSection>

                    {/* General Liability (Sales) */}
                    <FormSection title="General Liability (Exposure)">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Sales Item</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Monthly</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Yearly</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Inside Sales Total</td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('insideSalesMonthly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('insideSalesYearly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Liquor Sales</td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('liquorSalesMonthly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('liquorSalesYearly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Gas Sales</td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('gasSalesMonthly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <input
                                  {...register('gasSalesYearly')}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="$0"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </FormSection>

                    {/* Business Details */}
                    <FormSection title="Business Details">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { name: 'fein', label: 'FEIN (Federal Employer ID)' },
                          { name: 'dba', label: 'DBA (Doing Business As)' },
                          { name: 'hoursOfOperation', label: 'Hours of Operation' },
                          { name: 'noOfMPDs', label: 'No. of Multi Product Dispensers (MPDs)' },
                          { name: 'constructionType', label: 'Construction Type' },
                          { name: 'yearsInBusiness', label: 'Years in Business' },
                          { name: 'yearsAtLocation', label: 'Years at Location' },
                          { name: 'yearBuilt', label: 'Year Built' },
                          { name: 'yearOfLatestUpdate', label: 'Year of Latest Update' },
                          { name: 'totalSqFootage', label: 'Total Sq. Footage' },
                          { name: 'protectionClass', label: 'Protection Class' },
                          { name: 'additionalInsured', label: 'Additional Insured' },
                          { name: 'alarm', label: 'Alarm' },
                          { name: 'noOfEmployees', label: 'No. of Employees' },
                          { name: 'payroll', label: 'Payroll' },
                          { name: 'officersInclExcl', label: 'Officers Incl/Excl' },
                          { name: 'ownership', label: 'Ownership %' }
                        ].map((field) => (
                          <DragDropFormField 
                            key={field.name}
                            name={field.name as keyof FormData}
                            label={field.label}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        ))}
                      </div>
                      
                      {/* Yes/No Questions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {/* Any Leased Out Space */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Any Leased Out Space?
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('anyLeasedOutSpace')}
                                value="yes"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('anyLeasedOutSpace')}
                                value="no"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Carwash */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Carwash Available?
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('carwash')}
                                value="yes"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('carwash')}
                                value="no"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Cooking */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Food Preparation/Cooking?
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('cooking')}
                                value="yes"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...register('cooking')}
                                value="no"
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </FormSection>

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
                <div className="space-y-6">
                  
                  {/* Address Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">📍 Address Information</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {smartyData.data.address && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Property Address:</span>
                          <span 
                            className="text-gray-800 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', smartyData.data.address);
                              (window as any).draggedSmartyData = { label: 'Property Address', value: smartyData.data.address };
                            }}
                          >
                            {smartyData.data.address}
                          </span>
                        </div>
                      )}
                      
                      {smartyData.data.fullMailingAddress && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Mailing Address:</span>
                          <span 
                            className="text-gray-800 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', smartyData.data.fullMailingAddress);
                              (window as any).draggedSmartyData = { label: 'Mailing Address', value: smartyData.data.fullMailingAddress };
                            }}
                          >
                            {smartyData.data.fullMailingAddress}
                          </span>
                        </div>
                      )}

                      {smartyData.data.matchedAddress && (
                        <div className="ml-4 text-xs text-gray-500">
                          <div>Street: {smartyData.data.matchedAddress.street}</div>
                          <div>City: {smartyData.data.matchedAddress.city}</div>
                          <div>State: {smartyData.data.matchedAddress.state}</div>
                          <div>ZIP: {smartyData.data.matchedAddress.zipcode}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">👤 Owner Information</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {smartyData.data.deedOwnerFullName && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Deed Owner:</span>
                          <span 
                            className="text-gray-800 cursor-pointer hover:bg-green-100 px-2 py-1 rounded"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', smartyData.data.deedOwnerFullName);
                              (window as any).draggedSmartyData = { label: 'Deed Owner', value: smartyData.data.deedOwnerFullName };
                            }}
                          >
                            {smartyData.data.deedOwnerFullName}
                          </span>
                        </div>
                      )}

                      {smartyData.data.corporationName && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Corporation:</span>
                          <span 
                            className="text-gray-800 cursor-pointer hover:bg-green-100 px-2 py-1 rounded"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', smartyData.data.corporationName);
                              (window as any).draggedSmartyData = { label: 'Corporation', value: smartyData.data.corporationName };
                            }}
                          >
                            {smartyData.data.corporationName}
                          </span>
                        </div>
                      )}

                      {smartyData.data.ownershipType && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Ownership Type:</span>
                          <span className="text-gray-800">{smartyData.data.ownershipType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ALL OTHER ATTRIBUTES (Dynamic) */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 All Available Data</h3>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {Object.entries(smartyData.data)
                          .filter(([key, value]) => 
                            value !== null && 
                            value !== undefined && 
                            value !== '' && 
                            typeof value !== 'object'
                          )
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-gray-200">
                              <span className="font-medium text-gray-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                              </span>
                              <span 
                                className="text-gray-700 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded max-w-xs truncate"
                                draggable
                                title={`Drag to fill form field with: ${value}`}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', String(value));
                                  (window as any).draggedSmartyData = { label: key, value: String(value) };
                                }}
                              >
                                {String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Fill All Button */}
                  <button
                    onClick={fillFieldsFromSmarty}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Fill All Available Form Fields ({Object.keys(smartyData.data).length} attributes)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}