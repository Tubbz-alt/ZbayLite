import React from 'react'
import { shell } from 'electron'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import UserListItem from '../channelSettings/UserListItem'
import LoadingButton from '../../ui/LoadingButton'

const styles = theme => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  alignLabel: {
    marginTop: 3
  },
  labelDiv: {
    marginTop: 16,
    marginBottom: 24
  },
  itemName: {
    fontSize: 14
  },
  imageHostsDiv: {
    marginTop: 32
  },
  button: {
    height: 60,
    marginTop: 24,
    width: 168,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  rescanButton: {
    height: 60,
    marginTop: 24,
    width: 240,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  }
})

export const Security = ({
  classes,
  whitelisted,
  autoload,
  allowAll,
  toggleAllowAll,
  removeImageHost,
  removeSiteHost,
  openSeedModal,
  registerOnionAddress,
  useTor,
  isRescanned,
  onRescan
}) => {
  return (
    <Grid container direction='column'>
      <Grid
        container
        item
        justify='space-between'
        alignItems='center'
        className={classes.titleDiv}
      >
        <Grid item className={classes.title}>
          <Typography variant='h3'>Security</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item className={classes.subtitle}>
          <Typography variant='h5'>Your private recovery key</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            If something happens to your computer, you’ll need this key to
            recover your account and your funds.
          </Typography>
        </Grid>
        <Grid item className={classes.buttonDiv}>
          <LoadingButton
            variant='contained'
            size='large'
            color='primary'
            type='submit'
            fullWidth
            inProgress={false}
            className={classes.button}
            onClick={() => {
              openSeedModal()
            }}
            text='View key'
          />
        </Grid>
      </Grid>
      <Grid item className={classes.subtitle}>
        <Typography variant='h5'>P2P messaging over Tor</Typography>
      </Grid>
      <Grid item>
        <Typography variant='body2'>
          For faster message delivery, Zbay can send and receive messages
          directly with Tor (instead of the Zcash blockchain) when other users
          are online.{' '}
          <a
            className={classes.link}
            onClick={e => {
              e.preventDefault()
              shell.openExternal('https://www.zbay.app/faq.html')
            }}
            href='https://www.zbay.app/faq.html'
          >
            Learn more.
          </a>
        </Typography>
      </Grid>

      <Grid item container direction='column' className={classes.labelDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={useTor}
              onChange={e => {
                registerOnionAddress(true)
              }}
              color='default'
            />
          }
          label={
            <Typography variant='body2' className={classes.alignLabel}>
              Use Tor for messaging when possible
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!useTor}
              onChange={e => {
                registerOnionAddress(false)
              }}
              color='default'
            />
          }
          label={
            <Typography variant='body2' className={classes.alignLabel}>
              Only use Zcash for messaging
            </Typography>
          }
        />
      </Grid>
      <Grid item className={classes.subtitle}>
        <Typography variant='h5'>Verification</Typography>
      </Grid>
      {isRescanned ? (
        <Grid item>
          <Typography variant='body2'>Zbay has been re-synced.</Typography>
        </Grid>
      ) : (
        <>
          <Grid item>
            <Typography variant='body2'>
              To start quickly, Zbay includes username and channel registration
              data in the app itself. If the Zbay team omitted some data, or
              provided incorrect data, a user or channel could be censored or
              impersonated. To verify this data, which takes ~1 hour but may add
              some security, you can restart & re-sync. You only need to do this
              once.
            </Typography>
          </Grid>
          <Grid item className={classes.buttonDiv}>
            <LoadingButton
              variant='contained'
              size='large'
              color='primary'
              type='submit'
              fullWidth
              inProgress={false}
              className={classes.rescanButton}
              onClick={() => {
                onRescan()
              }}
              text='Restart & re-sync'
            />
          </Grid>
        </>
      )}
      <Grid item className={classes.subtitle}>
        <Typography variant='h5'>Outbound Links</Typography>
      </Grid>
      <Grid item className={classes.labelDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowAll}
              onChange={e => {
                toggleAllowAll(e.target.checked)
              }}
              color='default'
            />
          }
          label={
            <Typography variant='body2' className={classes.alignLabel}>
              Never warn me about outbound link on Zbay.
            </Typography>
          }
        />
      </Grid>
      {!!whitelisted.length && (
        <>
          <Grid item className={classes.subtitle}>
            <Typography variant='h5'>Allowed sites</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Links from these sites will not trigger warrning:
            </Typography>
          </Grid>
          {whitelisted.map(hostname => {
            return (
              <Grid item>
                <UserListItem
                  name={hostname}
                  actionName='Remove'
                  classes={{ name: classes.itemName }}
                  prefix=''
                  action={() => {
                    removeSiteHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </>
      )}
      {!!autoload.length && (
        <Grid item className={classes.imageHostsDiv}>
          <Grid item className={classes.subtitle}>
            <Typography variant='h5'>Allowed image hosts</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Images from these sites will be auto-loaded:
            </Typography>
          </Grid>
          {autoload.map(hostname => {
            return (
              <Grid item>
                <UserListItem
                  name={hostname.substring(0, 30)}
                  classes={{ name: classes.itemName }}
                  actionName='Remove'
                  prefix=''
                  action={() => {
                    removeImageHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      )}
    </Grid>
  )
}
Security.propTypes = {
  classes: PropTypes.object.isRequired,
  whitelisted: PropTypes.array.isRequired,
  autoload: PropTypes.array.isRequired,
  allowAll: PropTypes.bool.isRequired,
  toggleAllowAll: PropTypes.func.isRequired,
  openSeedModal: PropTypes.func.isRequired,
  removeImageHost: PropTypes.func.isRequired,
  removeSiteHost: PropTypes.func.isRequired
}
Security.defaultProps = {}

export default withStyles(styles)(Security)
