"use strict";

function RoonApiVolumeControl(roon, opts) {
    this._objs = []
    this._id = 1;

    this._svc = roon.register_service("com.roonlabs.volumecontrol:1", {
        subscriptions: [
            {
                subscribe_name:   "subscribe_controls",
                unsubscribe_name: "unsubscribe_controls",
                start: (req) => {
                    req.send_continue("Subscribed", { volume_controls: this._objs.reduce((p,e) => p.push(e.data.state) && p, []) });
                }
            }
        ],
        methods: {
            get_all: (req) => {
                req.send_complete("Success", { volume_controls: this._objs.reduce((p,e) => p.push(e.data.state) && p, []) });
            },
            set_volume: (req) => {
                var d = this._objs[req.body.key].data;
                d.set_volume(req, req.body.mode, req.body.value);
            },
            set_mute: (req) => {
                var d = this._objs[req.body.key].data;
                d.set_mute(req, req.body.action);
            }
        }
    });

    this.services = [ this._svc ];
}

RoonApiVolumeControl.prototype.new_device = function(o) {
    o.state.key = this._id++;
    this._objs[o.state.key] = o;
    this._svc.send_continue_all('subscribe', "Changed", { controls_added: [ o.state ] });
    return {
        destroy: () => {
            this._svc.send_continue_all('subscribe_controls', "Changed", { controls_removed: [ o.key ] });
            delete(this._objs[o.key]);
        },
        update_state: (state) => {
            for (let x in state) if (o.state[x] !== state[x]) o.state[x] = state[x];
            _svc.send_continue_all('subscribe_controls', "Changed", { controls_changed: [ o.state ] });
        }
    }
};

exports = module.exports = RoonApiVolumeControl;