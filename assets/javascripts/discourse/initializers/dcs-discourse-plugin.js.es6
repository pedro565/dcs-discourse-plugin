//------------------------------------------------------------------------------

import { observes } from 'ember-addons/ember-computed-decorators'
import ApplicationRoute from 'discourse/routes/application'
//import ModalFunctionality from 'discourse/mixins/modal-functionality'
//import Mobile from 'discourse/lib/mobile'
//import ApplicationController from 'discourse/controllers/application'

// Prod imports
import {
  onAfterRender,
  onError,
  onEvent,
  onTopicStateChanged,
  onWillTransition,
  utils,
  Recipient
} from '../lib/lib.js.es6'

//if (Discourse.Environment === 'development') { }

//------------------------------------------------------------------------------

export default {
  name: 'dcs-discourse-plugin',

  initialize(container, app) {
    // If plugin is disabled, quit
    const controller = container.lookup('controller:application')
    if (!controller.siteSettings.dcs_discourse_plugin_enabled) {
      return
    }

    /*
		// Quit if mobile
    const site = container.lookup('site:main');
    if (site.mobileView) { return }		
    */

    // In case this is a SSO login...
    if (window.location.pathname === '/login') {
      // Put a hook on the closeModal function, so that we redirect user
      // to the original web site if he closes the login or create-account modal
      ApplicationRoute.reopen({
        actions: {
          closeModal() {
            if ($('.modal.login-modal, .modal.create-account').length) {
              location.href = document.referrer
            } else {
              this._super()
            }
          }
        }
      })

      // Quit without loading the plugin
      utils.log('SSO login detected: deactivating plugin')
      return
    }

    // If user comes from an "activate account" email link , redirect him to the
    // do cuss official web site rather than the forum. There might also a way to
    // completely disable email confirmation when signing up:
    //https://meta.discourse.org/t/how-to-turn-off-discourse-email-verification/75365/4?u=syl
    if (document.referrer.includes('/u/activate-account/')) {
      console.log('document.referrer: ', document.referrer)
      location = 'http://www.doc' + 'uss.org'
      return
    }

    // If we're not in an iframe, quit
    if (window.self === window.top) {
      return
    }
    utils.log('Running in an iframe')

    // Only in Discourse Prod, there is this feature: when you are on a Discourse
    // page and log in, Discourse reloads the page you where in (whether in
    // Discourse Dev, it reloads the home page). This is no good for
    // Do cuss. Indeed, in Do cuss, you often are on a "404 - not found" page. This
    // page doesn't load plugins, so reloading it after login prevents Do cuss
    // from running! So what we are going to do is to intercept login and change
    // the current url before Discourse reloads, so that it reloads 'home'
    // instead of the current page. See:
    // https://github.com/discourse/discourse/blob/eda1462b3b8f57aace0c49b1d64edfcf3d1f45b2/app/assets/javascripts/discourse/controllers/login.js.es6#L137
    // https://github.com/discourse/discourse/blob/875008522de225ddcd7b14638b9f054a0acad7b5/app/assets/javascripts/discourse.js.es6#L100
    const loginController = container.lookup('controller:login')
    loginController.addObserver('loggedIn', null, function(context) {
      if (context.target.currentURL === '/404') {
        history.replaceState(null, '', '/')
      }
    })

    // Create a communication channel with the left iframe
    container.leftIFrameRecipient = new utils.Recipient({
      myName: 'dcs-discourse-plugin',
      recName: 'dcs-decorator 2',
      recWindow: parent.frames[0],
      recOrigin: '*',
      msgHandler: msg => onEvent(container, msg),
      pingStrategy: 'silent',
      timeout: 10000
    })

    // Wait until the page is rendered, then modify some stuff in the page
    Ember.run.schedule('afterRender', this, onAfterRender)

    /*
		// Force mobile view whenever viewport size is below 756, so that:
		// - on small screens, right pane be in mobile view
		// - we can test it easily on Chrome by setting the window to its minimum width
		// See https://github.com/discourse/discourse/blob/70fb2431a1b82b20f1a0b6e09db30f98331fb8cf/app/assets/javascripts/discourse/lib/mobile.js.es6
		// We cannot use forceMobile() alone. Indeed, reloading the page is required
		// in order to load the appropriate css file.
		// WE CANNOT DO THIS OUTSIDE initialize(), as the Mobile object is not
		// initialized yet. This causes the following issue: first time users runs the
		// app on a small screen, the screen is displayed in desktop view, then reloaded
		// immediately in mobile view.
		const viewportWidth = $(window).width()
		const shouldBeMobileView = viewportWidth <= 756
		if (shouldBeMobileView !== Mobile.mobileView) {
			Mobile.toggleMobileView()
		}
		*/

    // Discourse extension to add tag-myTagName class to <li> elements
    //addTagClasses()

    //
    // Register the willTransition handler
    // There are 2 ways we can do this:
    // * Using the "willTransition" action of "ApplicationRoute".
    //   Drawbacks:
    //		- Does not always fire. For example, in Discourse, it doesn't fire
    //      when clicking the 'Unread' link in top menu.
    //    - Does not fire at load time. See https://github.com/emberjs/ember.js/issues/10235#issuecomment-298577949.
    //      But there's an easy workaround for that, using the "beforeModel"
    //      function:
    //					beforeModel(transition) {
    //						utils.log('Just got refreshed')
    //						this.actions.willTransition.call(this, transition)
    //						return this._super(transition)
    //					},
    // * Using the "willTransition" event of the router.
    //   Drawbacks:
    //    - Doesn't support the "abort" function. See https://github.com/emberjs/ember.js/issues/10235#issuecomment-298576811.
    //
    const router = container.lookup('router:main')
    router.reopen({
      doSomething: function(transition) {
        onWillTransition(container, transition)
      }.on('willTransition')
    })

    // Watch topic states
    ApplicationRoute.reopen({
      actions: {
        // Error management. See:
        // https://discuss.emberjs.com/t/how-to-deal-with-route-when-model-gets-a-404/5283/3
        error(err, transition) {
          return onError(this, container, err, transition)
        }
      },

      // messageCount is the message index that changes whenever a new state
      // message is sent. It doesn't mean something as changed, though: a new
      // message is always sent when there's a route change.
      @observes('topicTrackingState.messageCount')
      topicStateChanged() {
        const appCtrl = this.controllerFor('application')
        const topicStates = appCtrl.topicTrackingState.states
        onTopicStateChanged(container, topicStates)
      }
    })

    // Ready
    container.leftIFrameRecipient.postMessage({ type: 'reloaded' })
  }
}

//------------------------------------------------------------------------------
