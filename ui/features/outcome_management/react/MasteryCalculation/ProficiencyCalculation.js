/*
 * Copyright (C) 2020 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import I18n from 'i18n!MasteryScale'
import numberHelper from '@canvas/i18n/numberHelper'
import {Button} from '@instructure/ui-buttons'
import {FormFieldGroup} from '@instructure/ui-form-field'
import {Flex} from '@instructure/ui-flex'
import {Text} from '@instructure/ui-text'
import {Heading} from '@instructure/ui-heading'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
import {View} from '@instructure/ui-view'
import {NumberInput} from '@instructure/ui-number-input'
import {SimpleSelect} from '@instructure/ui-simple-select'
import {showFlashAlert} from '@canvas/alerts/react/FlashAlert'
import CalculationMethodContent from '@canvas/grade-summary/backbone/models/CalculationMethodContent'
import ConfirmMasteryModal from '../ConfirmMasteryModal'
import useCanvasContext from '@canvas/outcomes/react/hooks/useCanvasContext'

export const defaultProficiencyCalculation = {
  calculationMethod: 'decaying_average',
  calculationInt: 65
}

const validInt = (method, value) => {
  if (method.validRange) {
    const [min, max] = method.validRange
    return value >= min && value <= max
  } else {
    return !value
  }
}

const CalculationIntInput = ({updateCalculationInt, calculationMethod, calculationInt}) => {
  const handleChange = (_event, data) => {
    if (data === '') {
      updateCalculationInt('')
    } else {
      const parsed = numberHelper.parse(data)
      if (!Number.isNaN(parsed)) {
        updateCalculationInt(parsed)
      }
    }
  }

  const handleIncrement = () => {
    updateCalculationInt(calculationInt !== '' ? calculationInt + 1 : 1)
  }

  const handleDecrement = () => {
    updateCalculationInt(calculationInt - 1)
  }

  const errorMessages = []
  if (calculationInt === '') {
    errorMessages.push({text: I18n.t('Must be a number'), type: 'error'})
  } else if (!validInt(calculationMethod, calculationInt)) {
    errorMessages.push({
      text: I18n.t('Must be between %{lower} and %{upper}', {
        lower: calculationMethod.validRange[0],
        upper: calculationMethod.validRange[1]
      }),
      type: 'error'
    })
  }

  return (
    <NumberInput
      renderLabel={() => I18n.t('Parameter')}
      value={typeof calculationInt === 'number' ? calculationInt : ''}
      messages={errorMessages}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onChange={handleChange}
    />
  )
}

const Display = ({calculationInt, currentMethod, individualOutcome}) => {
  const individualOutcomeDisplay = individualOutcome === 'display'
  return (
    <View as="div" padding="small none none">
      <Flex
        wrap="wrap"
        direction={individualOutcomeDisplay ? 'row' : 'column'}
        padding={individualOutcomeDisplay ? 'none small small none' : 'none small none none'}
      >
        <Flex.Item as="div" padding="none xx-small none none">
          {individualOutcomeDisplay ? (
            <Text weight="bold">{I18n.t('Proficiency Calculation:')}</Text>
          ) : (
            <Heading level="h4">{I18n.t('Mastery Calculation')}</Heading>
          )}
        </Flex.Item>
        <Flex.Item>
          <Text color="primary" weight="normal">
            {currentMethod.friendlyCalculationMethod}
          </Text>
        </Flex.Item>
      </Flex>
      {currentMethod.validRange && (
        <Flex
          wrap="wrap"
          direction={individualOutcomeDisplay ? 'row' : 'column'}
          padding={individualOutcomeDisplay ? 'none small small none' : 'none small none none'}
        >
          <Flex.Item as="div" padding="none xx-small none none">
            {individualOutcomeDisplay ? (
              <Text weight="bold">{I18n.t('Parameter:')}</Text>
            ) : (
              <Heading margin="medium none none" level="h4">
                {I18n.t('Parameter')}
              </Heading>
            )}
          </Flex.Item>
          <Flex.Item>
            <Text color="primary" weight="normal">
              {calculationInt}
            </Text>
          </Flex.Item>
        </Flex>
      )}
    </View>
  )
}

const Form = ({
  calculationMethodKey,
  calculationInt,
  calculationMethods,
  currentMethod,
  updateCalculationMethod,
  setCalculationInt,
  individualOutcomeForm
}) => (
  <FormFieldGroup
    description={
      <ScreenReaderContent>{I18n.t('Mastery calculation parameters')}</ScreenReaderContent>
    }
  >
    <ScreenReaderContent>
      {I18n.t(
        'See example below to see how different calculation parameters affect student mastery calculation.'
      )}
    </ScreenReaderContent>
    <SimpleSelect
      renderLabel={
        individualOutcomeForm ? I18n.t('Calculation Method') : I18n.t('Mastery Calculation')
      }
      value={calculationMethodKey}
      onChange={updateCalculationMethod}
    >
      {Object.keys(calculationMethods).map(key => (
        <SimpleSelect.Option key={key} id={key} value={key}>
          {calculationMethods[key].friendlyCalculationMethod}
        </SimpleSelect.Option>
      ))}
    </SimpleSelect>
    {currentMethod.validRange && (
      <CalculationIntInput
        calculationInt={calculationInt}
        calculationMethod={currentMethod}
        updateCalculationInt={setCalculationInt}
      />
    )}
  </FormFieldGroup>
)

const Example = ({currentMethod, individualOutcomeExample}) => {
  return (
    <div>
      <Text weight="bold">{I18n.t('Example')}</Text>
      <Text>
        <View as="div" padding={individualOutcomeExample ? 'x-small 0 x-small' : 'small 0 x-small'}>
          {currentMethod.exampleText}
        </View>
        <View as="div" padding="x-small 0">
          {I18n.t('Item Scores:')}&nbsp;
          <Text weight="bold"> {currentMethod.exampleScores}</Text>
        </View>
        <View as="div" padding="x-small 0">
          {I18n.t('Final Score:')}&nbsp;
          <Text weight="bold">{currentMethod.exampleResult}</Text>
        </View>
      </Text>
    </div>
  )
}

const getModalText = contextType => {
  if (contextType === 'Course') {
    return I18n.t('This will update all student mastery results within this course.')
  }
  return I18n.t(
    'This will update all student mastery results tied to the account level mastery calculation.'
  )
}

const ProficiencyCalculation = ({
  method,
  update,
  updateError,
  canManage,
  onNotifyPendingChanges,
  individualOutcome,
  setError
}) => {
  const {contextType} = useCanvasContext()
  const {calculationMethod: initialMethodKey, calculationInt: initialInt} = method

  const [calculationMethodKey, setCalculationMethodKey] = useState(initialMethodKey)
  const [calculationInt, setCalculationInt] = useState(initialInt)

  const [allowSave, realSetAllowSave] = useState(false)
  const [showConfirmation, setShowConfirmationModal] = useState(false)

  const individualOutcomeEdit = individualOutcome === 'edit'

  const setAllowSave = newAllowSave => {
    realSetAllowSave(newAllowSave)
    if (onNotifyPendingChanges) {
      onNotifyPendingChanges(newAllowSave)
    }
  }

  useEffect(() => {
    if (updateError) {
      showFlashAlert({
        message: I18n.t('An error occurred updating the calculation method'),
        type: 'error'
      })
    }
  }, [updateError])

  const calculationMethods = new CalculationMethodContent({
    calculation_method: calculationMethodKey,
    calculation_int: calculationInt
  }).toJSON()
  const currentMethod = calculationMethods[calculationMethodKey]

  // Sync data/errors between internal/component and external/parent state
  const syncInternalWithExternalState = (calcMethodKey, calcInt) => {
    if (individualOutcomeEdit) {
      update(calcMethodKey, calcInt)
      typeof setError === 'function' &&
        setError(!validInt(calculationMethods[calcMethodKey], calcInt))
    }
  }
  const updateCalculationMethod = (_event, data) => {
    const newMethod = data.id
    const newCalculationInt = calculationMethods[newMethod].defaultInt || null
    if (newMethod !== calculationMethodKey) {
      setCalculationMethodKey(newMethod)
      setCalculationInt(newCalculationInt)
      if (initialMethodKey === newMethod && initialInt === newCalculationInt) {
        setAllowSave(false)
      } else {
        setAllowSave(true)
      }
      syncInternalWithExternalState(newMethod, newCalculationInt)
    }
  }

  const updateCalculationInt = newCalculationInt => {
    setCalculationInt(newCalculationInt)
    if (initialMethodKey === calculationMethodKey && initialInt === newCalculationInt) {
      setAllowSave(false)
    } else {
      setAllowSave(true)
    }
    syncInternalWithExternalState(calculationMethodKey, newCalculationInt)
  }

  const saveCalculationMethod = () => {
    update(calculationMethodKey, calculationInt)
    setShowConfirmationModal(false)
    setAllowSave(false)
  }

  const individualOutcomeDisplay = individualOutcome === 'display'

  return (
    <View as="div">
      <Flex
        alignItems="start"
        direction={individualOutcomeEdit ? 'row' : 'column'}
        wrap={individualOutcomeEdit ? 'wrap' : 'no-wrap'}
      >
        <Flex.Item
          padding={
            individualOutcomeDisplay
              ? 'none'
              : individualOutcomeEdit
              ? 'none medium none none'
              : 'small'
          }
        >
          {canManage ? (
            <Form
              calculationMethodKey={calculationMethodKey}
              calculationInt={calculationInt}
              calculationMethods={calculationMethods}
              currentMethod={currentMethod}
              updateCalculationMethod={updateCalculationMethod}
              setCalculationInt={updateCalculationInt}
              individualOutcomeForm={individualOutcomeEdit}
            />
          ) : (
            <Display
              currentMethod={currentMethod}
              calculationInt={calculationInt}
              individualOutcome={individualOutcome}
            />
          )}
        </Flex.Item>
        {!individualOutcomeDisplay && (
          <Flex.Item
            padding={individualOutcomeEdit ? 'none small small none' : 'small'}
            size={individualOutcomeEdit ? '50%' : '100%'}
            shouldGrow={individualOutcomeEdit}
          >
            <div style={{paddingTop: individualOutcomeEdit ? '1.35rem' : '0'}}>
              <Example
                currentMethod={currentMethod}
                individualOutcomeExample={individualOutcomeEdit}
              />
            </div>
          </Flex.Item>
        )}
      </Flex>
      {canManage && !individualOutcomeEdit && (
        <div className="save">
          <Button
            variant="primary"
            interaction={allowSave ? 'enabled' : 'disabled'}
            onClick={() => {
              if (validInt(currentMethod, calculationInt)) {
                setShowConfirmationModal(true)
              }
            }}
          >
            {I18n.t('Save Mastery Calculation')}
          </Button>
          <ConfirmMasteryModal
            isOpen={showConfirmation}
            onConfirm={saveCalculationMethod}
            modalText={getModalText(contextType)}
            title={I18n.t('Confirm Mastery Calculation')}
            onClose={() => setShowConfirmationModal(false)}
          />
        </div>
      )}
    </View>
  )
}

ProficiencyCalculation.propTypes = {
  method: PropTypes.shape({
    calculationMethod: PropTypes.string.isRequired,
    calculationInt: PropTypes.number
  }),
  canManage: PropTypes.bool,
  update: PropTypes.func,
  onNotifyPendingChanges: PropTypes.func,
  updateError: PropTypes.string,
  individualOutcome: PropTypes.oneOf(['display', 'edit']),
  setError: PropTypes.func
}

ProficiencyCalculation.defaultProps = {
  method: {
    calculationMethod: 'decaying_average',
    calculationInt: 65
  },
  updateError: null,
  update: () => {}
}

ProficiencyCalculation.defaultProps = {
  method: defaultProficiencyCalculation,
  updateError: null
}

export default ProficiencyCalculation
