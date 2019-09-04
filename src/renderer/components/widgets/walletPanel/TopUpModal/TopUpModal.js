import React from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import MenuItem from '@material-ui/core/MenuItem'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Select from '@material-ui/core/Select'
import { withStyles } from '@material-ui/core/styles'

import FileCopyIcon from '@material-ui/icons/FileCopy'

import Modal from '../../../ui/Modal'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  title: {
    paddingBottom: theme.spacing(1)
  },
  select: {
    ...theme.typography.h5,
    padding: '0 24px 0 0'
  },
  selectWrapper: {
    margin: '0 8px',
    borderBottom: 'none'
  },
  shield: {
    marginTop: theme.spacing(2)
  },
  dataRoot: {
    padding: `0 ${theme.spacing(4)}px`
  },
  description: {
    marginBottom: theme.spacing(2)
  },
  copyField: {
    width: 500,
    marginBottom: theme.spacing(2)
  },
  copyInput: {
    color: theme.typography.caption.color
  }
})

export const TopUpModal = ({
  classes,
  open,
  type,
  address,
  description,
  handleChange,
  handleClose,
  handleCopy
}) => (
  <Modal
    open={open}
    handleClose={handleClose}
    title='Receive money'
  >
    <Grid container justify='center' className={classes.root}>
      <Grid item container justify='center' className={classes.title}>
        <Typography variant='h5'>
          Add funds to your
        </Typography>
        <Select
          displayEmpty
          name='address'
          value={type}
          onChange={handleChange}
          className={classes.selectWrapper}
          classes={{ select: classes.select }}
        >
          <MenuItem value={'transparent'}>transparent</MenuItem>
          <MenuItem value={'private'}>private</MenuItem>
        </Select>
        <Typography variant='h5'>
          address
        </Typography>
      </Grid>
      <Grid item>
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
          className={classes.dataRoot}
          spacing={2}
        >
          <Grid item>
            <Typography variant='body2' className={classes.description}>
              {description}
            </Typography>
          </Grid>
          <Grid item>
            <QRCode value={address} size={192} />
          </Grid>
          <Grid item>
            <TextField
              id='copy-address'
              className={classes.copyField}
              variant='outlined'
              type='text'
              value={address}
              disabled
              InputProps={{
                classes: { input: classes.copyInput },
                endAdornment: (
                  <InputAdornment position='end'>
                    <CopyToClipboard text={address} onCopy={handleCopy}>
                      <IconButton>
                        <FileCopyIcon />
                      </IconButton>
                    </CopyToClipboard>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Modal>
)

TopUpModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

TopUpModal.defaultProps = {
  open: false,
  handleCopy: () => null
}

export default withStyles(styles)(TopUpModal)
