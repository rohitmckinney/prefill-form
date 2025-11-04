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
      
      if (result.success) {
        console.log('✅ Received prefill data:', result)
        
        // Store the complete Smarty data for the side panel
        setSmartyData(result)
        setShowSidePanelData(true)
        
        setFetchMessage(`✅ Found property data! Check the side panel to review and fill fields.`)
        setTimeout(() => setFetchMessage(null), 5000)
      } else {
        console.log('❌ Fetch failed:', result.message)
        setFetchMessage(`❌ ${result.message}`)
        setTimeout(() => setFetchMessage(null), 5000)
      }
    } catch (error) {
      console.error('💥 Fetch error:', error)
      setFetchMessage('❌ Error fetching data. Please try again.')
      setTimeout(() => setFetchMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const fillFieldsFromSmarty = () => {
    if (smartyData?.data) {
      console.log('🔄 Filling form fields with Smarty data')
      
      // Auto-fill the form fields with received data
      Object.entries(smartyData.data).forEach(([key, value]) => {
        if (value && value !== '') {
          setValue(key as keyof FormData, value)
        }
      })
      
      setFetchMessage(`✅ Auto-filled ${Object.keys(smartyData.data).length} fields successfully!`)
      setTimeout(() => setFetchMessage(null), 5000)
    }
  }

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data) // Debug log
    setSubmittedData(data)
    setIsSubmitted(true)
    setShowSuccess(true)
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const downloadPDF = () => {
    if (submittedData) {
      console.log('Downloading PDF with data:', submittedData) // Debug log
      const pdf = generatePDF(submittedData)
      pdf.save('convenience-store-application.pdf')
    }
  }

  const resetForm = () => {
    reset()
    setIsSubmitted(false)
    setSubmittedData(null)
    setShowSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mckinney & Co. Insurance
            </h1>
            <h2 className="text-xl text-gray-700 mb-4">
              Convenience Store Application
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome! Please complete this short form so our team can prepare your quote.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✓</div>
              <p className="text-green-800 font-medium">Form saved successfully!</p>
            </div>
          </div>
        )}

        {/* Main Layout with Side Panel */}
        <div className="flex gap-8">
          
          {/* Main Form Section */}
          <div className={`transition-all duration-300 ${showSidePanelData ? 'w-2/3' : 'w-full'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Address Section - First Field */}
                  <FormSection title="Business Address">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Address *
                          </label>
                          <input
                            {...register('address', { required: 'Business address is required' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="Enter complete business address"
                            disabled={isLoading}
                            autoComplete="off"
                            type="text"
                            onFocus={() => console.log('Address input focused')}
                            onChange={(e) => console.log('Address input changed:', e.target.value)}
                          />
                          {errors.address && (
                            <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                          )}
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={fetchData}
                            disabled={isLoading}
                            className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                              isLoading 
                                ? 'bg-gray-400 text-white cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isLoading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading...
                              </div>
                            ) : (
                              'Fetch Data'
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Fetch Status Message */}
                      {fetchMessage && (
                        <div className={`p-3 rounded-md text-sm ${
                          fetchMessage.includes('✅') 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {fetchMessage}
                        </div>
                      )}
                    </div>
                  </FormSection>

              {/* Company Information */}
              <FormSection title="Company Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corporation Name *
                    </label>
                    <input
                      {...register('corporationName', { required: 'Corporation name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter corporation name"
                    />
                    {errors.corporationName && (
                      <p className="text-red-600 text-sm mt-1">{errors.corporationName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      {...register('contactName', { required: 'Contact name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter contact name"
                    />
                    {errors.contactName && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      {...register('contactNumber', { required: 'Contact number is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter contact number"
                    />
                    {errors.contactNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      {...register('contactEmail', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter email address"
                    />
                    {errors.contactEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactEmail.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Effective Date
                    </label>
                    <input
                      type="date"
                      {...register('proposedEffectiveDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prior Carrier
                    </label>
                    <input
                      {...register('priorCarrier')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter prior carrier"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Premium
                    </label>
                    <input
                      {...register('targetPremium')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter target premium"
                    />
                  </div>
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
                    <h3 className="font-medium text-gray-900 mb-2">Burglar Alarm</h3>
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
                    <h3 className="font-medium text-gray-900 mb-2">Fire Alarm</h3>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation Description
                  </label>
                  <textarea
                    {...register('operationDescription')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Describe your business operations..."
                  />
                </div>
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

              {/* Property Coverage Section */}
              <FormSection title="Property Coverage">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'building', label: 'Building' },
                    { name: 'bpp', label: 'Business Personal Property (BPP)' },
                    { name: 'bi', label: 'Business Income (BI)' },
                    { name: 'canopy', label: 'Canopy' },
                    { name: 'pumps', label: 'Pumps' },
                    { name: 'ms', label: 'Machinery & Equipment (M&S)' }
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        {...register(field.name as keyof FormData)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder={`Enter ${field.label.toLowerCase()} limit`}
                      />
                    </div>
                  ))}
                </div>
              </FormSection>

              {/* General Liability (Exposure) Section */}
              <FormSection title="General Liability (Exposure)">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
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
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('insideSalesYearly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Liquor Sales</td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('liquorSalesMonthly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('liquorSalesYearly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Gasoline Sales</td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('gasolineSalesMonthly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('gasolineSalesYearly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">Propane Filling/Exchange</td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('propaneFillingExchangeMonthly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <input
                            {...register('propaneFillingExchangeYearly')}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="$0"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Yes/No Questions for General Liability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Carwash */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carwash
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
                      Cooking
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

              {/* Business Details Section */}
              <FormSection title="Business Details">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'fein', label: 'FEIN (Federal Employer Identification Number)' },
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
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        {...register(field.name as keyof FormData)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Yes/No Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter complete address"
                  />
                </div>
              </FormSection>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Submit Application
                </button>
              </div>
            </form>
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
              
              {/* Debug Section - Shows captured data */}
              {submittedData && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Captured Data Preview:</h4>
                  <div className="text-xs text-gray-600 max-h-40 overflow-y-auto">
                    <div><strong>Corporation Name:</strong> {submittedData.corporationName || 'N/A'}</div>
                    <div><strong>Contact Name:</strong> {submittedData.contactName || 'N/A'}</div>
                    <div><strong>Contact Email:</strong> {submittedData.contactEmail || 'N/A'}</div>
                    <div><strong>Address:</strong> {submittedData.address || 'N/A'}</div>
                    <div><strong>FEIN:</strong> {submittedData.fein || 'N/A'}</div>
                    <div><strong>Building:</strong> {submittedData.building || 'N/A'}</div>
                    <div><strong>Inside Sales (Monthly):</strong> {submittedData.insideSalesMonthly || 'N/A'}</div>
                    <div><strong>Inside Sales (Yearly):</strong> {submittedData.insideSalesYearly || 'N/A'}</div>
                    <div><strong>Total Fields with Data:</strong> {Object.entries(submittedData).filter(([k,v]) => v && v !== '').length}</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadPDF}
                  className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Download Filled PDF
                </button>
                <button
                  onClick={resetForm}
                  className="bg-white text-black border border-gray-300 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Side Panel for Smarty Data */}
          {showSidePanelData && smartyData && (
            <div className="w-1/3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Property Data Found</h3>
                  <button
                    onClick={() => setShowSidePanelData(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Smarty Data Display */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Address:</strong> {smartyData.data.address || 'N/A'}
                  </div>
                  
                  {/* Available Form Fields */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Available Fields to Fill:</h4>
                    
                    {Object.entries(smartyData.data).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-md">
                        <div className="text-xs font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          {value || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Fill Fields Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={fillFieldsFromSmarty}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Fill These Fields in Form
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This will auto-fill {Object.keys(smartyData.data).length} fields in your form
                  </p>
                </div>
                
                {/* Raw Data Toggle */}
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    View Raw Property Data
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-40 overflow-y-auto">
                    <pre>{JSON.stringify(smartyData, null, 2)}</pre>
                  </div>
                </details>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}