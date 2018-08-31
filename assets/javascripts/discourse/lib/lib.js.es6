import t from"discourse/models/composer";import{NotificationLevels as e}from"discourse/lib/notification-levels";const s=t=>(window.dcsPostCloseBtnMsg=window.dcsPostCloseBtnMsg||function(){t.leftIFrameRecipient.postMessage({type:"closeBtnClicked"})},'\n\t\t<button id="dcs-close-btn" class="btn btn-default" style="margin-left:8px" \n\t\t\t\tonclick="javascript:window.dcsPostCloseBtnMsg()">\n\t\t\tClose\n\t\t</button>\t\t\n\t');function i(){const t=Discourse.User.current();$("html").addClass(`dcs-discourse-plugin ${t&&t.admin?"admin":"not-admin"}`);const e=`http://www.doc${"u".toUpperCase().toLowerCase()}ss.org`;$("header.d-header .title > a").attr({onclick:`window.open('${e}', ''); return false`,href:""});let s=!1;$(document).mousemove(t=>{!s&&t.clientY<10&&($(".d-header").addClass("dcs-show"),s=!0),s&&t.clientY>65&&($(".d-header").removeClass("dcs-show"),s=!1)})}var n={log(t){console.log(`dcs-discourse-plugin - ${t}`)},assert(t,e){if(!t){if(e=e||"dcs-discourse-plugin - Assertion failed","undefined"!=typeof Error)throw new Error(e);throw e}},delay:t=>new Promise(e=>setTimeout(e,t)),retry:(t,e,s=null)=>0===e?Promise.reject(s):t().catch(s=>n.retry(t,e-1,s)),retryDelay(t,e,s,i=null){const o=()=>n.delay(s).then(t);return 0===e?Promise.reject(i):t().catch(t=>n.retryDelay(o,e-1,t))}};function o(e,i,o,r){if(!o.jqXHR||404!==o.jqXHR.status)return!0;const c=r.dcsContext;if(!c)return!0;const l=c.callerMsg&&c.callerMsg.type;n.assert(l),"replaceWithTag"===l&&(n.assert(c.callerMsg.payload&&c.callerMsg.payload.headingDiscTag),function({container:e,linkDiscTag:i,headingDiscTag:n}){if($("#dcs-close-btn").remove(),!Discourse.User.current())return void a(`\n\t\t\t<div class="list-controls">\n\t\t\t\t<div class="container">${s(e)}</div>\n\t\t\t</div>\n\t\t\t<h3>This section has no topic yet</h3>\n\t\t\t<p>To create a topic, move the mouse to the top of the page and click \n\t\t\t\tthe Log In button.</p>\n\t\t`);window.dcsOnNewTopic=(()=>{const s=e.lookup("controller:composer");return s.open({action:t.CREATE_TOPIC,draftKey:"new_topic",topicTags:i+","+n})}),a(`\n\t\t<div class="list-controls">\n\t\t\t<div class="container">\n\t\t\t\t${s(e)}\n\t\t\t\t<button class="btn btn-default" onclick="dcsOnNewTopic()">\n\t\t\t\t\t<i class="fa fa-plus d-icon d-icon-plus"></i> <span>New Topic</span>\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<h3 style="margin-top:20px">This section has no topic yet</h3>\n\t`)}({container:i,linkDiscTag:c.callerMsg.payload.linkDiscTag,headingDiscTag:c.callerMsg.payload.headingDiscTag}))}function a(t){if($("#dcs-overlay").length)return void $("#dcs-overlay").html(t);const e=$("#main-outlet"),s=e.css(["padding-top","padding-right","padding-bottom","padding-left"]),i=_.reduce(s,(t,e,s)=>(t[s.substring(8)]=e,t),{});e.css({position:"relative"});const n=$(`\n\t\t<div id="dcs-overlay" \n\t\t\t\tstyle="position:absolute; background-color:white; z-index:100">\n\t\t\t${t}\n\t\t</div>\n\t`);n.css(i),n.appendTo(e)}function r(t,e){const s=t.lookup("router:main");if("replaceWithTag"===e.type){return c(e.payload,"linkDiscTag"),c(e.payload,"headingDiscTag"),void(s.replaceWith(`/tags/intersection/${e.payload.linkDiscTag}/${e.payload.headingDiscTag}`).dcsContext={callerMsg:e})}if("replaceWithTopic"===e.type){return c(e.payload,"linkDiscTag"),c(e.payload,"headingDiscTag"),c(e.payload,"topicId"),void(s.replaceWith(`/t/topic/${e.payload.topicId}`).dcsContext={callerMsg:e})}n.log("Unknown message from left iframe: "+JSON.stringify(e))}function c(t,e){n.assert(t[e],`Missing parameter "${e}"`)}function l(t,s){const i=_.chain(s).reject(t=>t.deleted||"private_message"===t.archetype).map(t=>({topicId:t.topic_id,isNewTopic:function(t){return null===t.last_read_post_number&&(0!==t.notification_level&&!t.notification_level||t.notification_level>=e.TRACKING)}(t),unreadPostCount:function(t){return null!==t.last_read_post_number&&t.last_read_post_number<t.highest_post_number&&t.notification_level>=e.TRACKING}(t)?t.highest_post_number-t.last_read_post_number:0})).reject(t=>!t.isNewTopic&&!t.unreadPostCount).value();i.length&&t.leftIFrameRecipient.postMessage({type:"topicStatesHaveChanged",payload:{topicStates:i}})}let d;function g(t,e){const i=`"${t.lookup("router:main").get("currentRouteName")}" (${d})`,o=`"${e.targetName}" (${e.intent.url})`;if(e.urlMethod?n.log(`Will replace ${i} with ${o})`):n.log(`Will transition from ${i} to ${o})`),d=e.intent.url,$("#dcs-overlay").remove(),"tags.intersection"!==e.targetName)if(e.targetName.startsWith("topic.")){if(e.dcsContext){const s=e.dcsContext.callerMsg.payload.linkDiscTag,i=e.dcsContext.callerMsg.payload.headingDiscTag;return n.assert(i),void u(t,e,s,i)}Promise.resolve(e).then(()=>{if(e.isAborted)return;const s=e.resolvedModels.topic;n.retryDelay(()=>s.hasOwnProperty("tags")?Promise.resolve():Promise.reject('no "tags" property'),15,200).then(()=>{const i=s.tags.find(t=>t.startsWith("dcsl-")),n=s.tags.find(t=>t.startsWith("dcsh-"));if(!i||!n)throw"exit";u(t,e,i,n)}).catch(s=>{h(t,e)})})}else h(t,e);else{const i=e.params["tags.intersection"].tag_id,n=e.params["tags.intersection"].additional_tags;i.startsWith("dcsl-")&&n.startsWith("dcsh-")&&function(t,e,i,n){p(!0),e.dcsContext||t.leftIFrameRecipient.postMessage({type:"willTransitionToHeadingTag",payload:{linkDiscTag:i,headingDiscTag:n}});Promise.resolve(e).then(()=>{e.isAborted||($("#dcs-close-btn").remove(),$(".navigation-container").prepend(s(t)))})}(t,e,i,n)}}function p(t){t?($("html").addClass("dcs-auto-hide-navbar"),$(".d-header").removeClass("dcs-show")):$("html").removeClass("dcs-auto-hide-navbar")}function u(t,e,i,n){p(!0),e.dcsContext||t.leftIFrameRecipient.postMessage({type:"willTransitionToDcsTopic",payload:{headingDiscTag:n,linkDiscTag:i,topicId:e.resolvedModels.topic.id}}),Promise.resolve(e).then(()=>{e.isAborted||$("#dcs-back-and-close").length||($("#dcs-close-btn").remove(),$("#main-outlet > .ember-view").first().prepend(`\n          <div id="dcs-back-and-close" class="list-controls">\n            <div class="container">\n              <a style="line-height:28px" href="/tags/intersection/${i}/${n}">\n                &#8630; Back to topic list\n              </a>\n              ${s(t)}\n            </div>\n          </div>\n        `))})}function h(t,e){p(!1),e.dcsContext||t.leftIFrameRecipient.postMessage({type:"willTransitionToOther",payload:{routeName:e.targetName}}),Promise.resolve(e).then(()=>{if($("#dcs-close-btn").length)return;const e=$(".icons.d-header-icons");(e.length?e:$(".header-buttons")).append(`<li style="margin-top:6px">${s(t)}</li>`)})}class m{constructor({myName:t,recName:e,recWindow:s,recOrigin:i,msgHandler:n,pingStrategy:o="aggressive",timeout:a,timeoutCb:r,log:c=!0}){this.myName=t,this.recName=e,this.recWindow=s,this.recOrigin=i,this.msgQueue=[];let l=null;"silent"!==o&&(this._postMessage({ping:!0}),"aggressive"===o&&(l=setInterval(()=>{this._postMessage({ping:!0})},200)));let d=null;a&&(d=setTimeout(()=>{this._log(`Timeout: couldn't connect to "${e}" after ${a/1e3}s`),clearInterval(l),this.msgQueue=null,r&&r()},a)),addEventListener("message",s=>{if(s.data.from===e||s.data.to===t){if("*"!==this.recOrigin&&s.origin!==this.recOrigin)return this._log(`Message from ${e}: ${JSON.stringify(s.data)}`),void this._log(`Origin mismatch: "${s.origin}" doesn't match ${this.recOrigin})`);c&&this._log(`Message from ${e}: ${JSON.stringify(s.data)}`),!s.data.ping||this.msgQueue&&this.msgQueue.length||this._postMessage({pingBack:!0}),this.msgQueue&&(clearInterval(d),clearInterval(l),this.msgQueue.forEach(t=>this._postMessage({msg:t})),this.msgQueue=null),s.data.ping||s.data.pingBack||n&&n(s.data.msg)}})}_log(t){console.log(`${this.myName} - ${t}`)}_postMessage(t){t=Object.assign({},t,{from:this.myName,to:this.recName}),this.recWindow.postMessage(t,this.recOrigin)}postMessage(t){this.msgQueue?this.msgQueue.push(t):this._postMessage({msg:t})}}export{s as closeBtn,i as onAfterRender,o as onError,r as onEvent,l as onTopicStateChanged,g as onWillTransition,n as utils,m as Recipient};