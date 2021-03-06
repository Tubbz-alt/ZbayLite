import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import * as R from 'ramda'
import { Formik } from 'formik'
import { withStyles } from '@material-ui/core/styles'

import { MESSAGE_SIZE, TAG_SIZE, TITLE_SIZE } from '../../../zbay/transit'
import AdvertModal from './AdvertModal'
import { getBytesSize } from '../../../../shared/helpers'

const styles = theme => ({})

export const formSchema = Yup.object().shape(
  {
    title: Yup.string()
      .test('testSize', 'Title is too long', function (value) {
        return getBytesSize(value) <= TITLE_SIZE
      })
      .required('Include a title'),
    zec: Yup.number().required('You must enter an amount'),
    usd: Yup.number()
      .max(9999)
      .required('You must enter an amount'),
    description: Yup.string().test(
      'testSize',
      'Your message is too long',
      function (value) {
        return getBytesSize(value) <= MESSAGE_SIZE
      }
    ),
    shippingInfo: Yup.bool().required('Required'),
    background: Yup.string(),
    tag: Yup.string()
      .test('testSize', 'Tag is too long', function (value) {
        return getBytesSize(value) <= TAG_SIZE
      })
      .min(1)
      .required('Include a tag')
  },
  ['title', 'zec', 'usd', 'description', 'shippingInfo', 'tag']
)
// TODO use addMethod instead of .test Yup seems to not add newMethod
// Yup.addMethod(Yup.mixed, 'validateSize', function (maxSize, errorMessage) {
//   return this.test('testSize', errorMessage, function (value) {
//     return getBytesSize(value) <= maxSize
//   })
// })
export const AdvertForm = ({
  classes,
  initialValues,
  handleSend,
  handleClose,
  ...props
}) => {
  const [sending, setSending] = React.useState(false)
  return (
    <Formik
      enableReinitialize
      validationSchema={formSchema}
      initialValues={{
        ...initialValues
      }}
      onSubmit={async (values, { resetForm }) => {
        setSending(true)
        await handleSend({ values })
        resetForm()
        handleClose()
        setSending(false)
      }}
    >
      {({
        values,
        isValid,
        submitForm,
        resetForm,
        setFieldValue,
        errors,
        touched
      }) => {
        return (
          <AdvertModal
            {...props}
            isValid={isValid}
            values={values}
            setFieldValue={setFieldValue}
            errors={errors}
            touched={touched}
            submitForm={submitForm}
            handleClose={handleClose}
            sending={sending}
          />
        )
      }}
    </Formik>
  )
}

AdvertForm.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    title: PropTypes.string.isRequired,
    zec: PropTypes.string.isRequired,
    usd: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    background: PropTypes.number.isRequired,
    tag: PropTypes.string.isRequired,
    shippingInfo: PropTypes.bool.isRequired
  }).isRequired,
  handleSend: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired
}

AdvertForm.defaultProps = {
  initialValues: {
    title: '',
    zec: '',
    usd: '',
    description: '',
    shippingInfo: false,
    background: 2,
    tag: ''
  }
}

export default R.compose(React.memo, withStyles(styles))(AdvertForm)
