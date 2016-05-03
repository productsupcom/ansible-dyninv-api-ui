var log = function(value) {
    if (value instanceof Array) {
        console.log('is an array');
    }
    console.log(value)
    return value
}

function sorts(list) {
    return {
        onclick: function(e) {
            var prop = e.target.getAttribute("data-sort-by")
            if (prop) {
                var first = list[0]
                list.sort(function(a, b) {
                    return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0
                })
                if (first === list[0]) list.reverse()
            }
        }
    }
}

var Host = function(data = Array) {
    this.id = m.prop(data["@id"]) || m.prop("");
    this.created = m.prop(data.created) || m.prop("");
    this.domain = m.prop(data.domain) || m.prop("");
    this.enabled = m.prop(data.enabled) || m.prop("");
    this.host = m.prop(data.host) || m.prop("");
    this.hostname = m.prop(data.hostname) || m.prop("");
    this.updated = m.prop(data.updated) || m.prop("");
    this.ip = m.prop(data.ip) || m.prop("");
    this.groups = m.prop(data.groups) || m.prop(Array);
    this.variables = m.prop(data.variables) || m.prop(Array);
};

Host.prototype.toJSON = function() {
    return {
        "@id": this.id(),
        "created": this.created(),
        "domain": this.domain(),
        "enabled": this.enabled(),
        "host": this.host(),
        "hostname": this.hostname(),
        "updated": this.updated(),
        "ip": this.ip(),
        "groups": this.groups(),
        "variables": this.variables()
    };
};

Host.update = function(host) {
    if (!(host instanceof Host)) {
        console.log('Argument needs to be of type Host.', host);
        return;
    }
    console.log(host);

    var base = "http://127.0.0.1:8000";
    url = base + host.id();
    m.request({
        method: "PUT",
        url: url,
        data: host,
    }).then(log)
}

Host.host = new Host();

Host.vm = (function() {
    var vm = {}
    vm.init = function() {
        vm.host = Host.host;
    }

    vm.select = function(host) {
        console.log(host.ip(), vm.host.ip());
        vm.host = host;
        console.log(host.ip(), vm.host.ip());
        m.redraw();
    }

    vm.update = function(data) {
        console.log(data);
        Host.update(data);
    }
    return vm
}())

Host.controller = function() {
    Host.vm.init();
}

Host.view = function() {
    return m("div", [
            Object.keys(Host.vm.host).map(function(property, index) {
                console.log(property, Host.vm.host[property]());
                return m("div[class=form-group]", [
                    m("label[for="+property+"]", property),
                    m("input[id="+property+"],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host[property]), value: Host.vm.host[property]()}),
                ]);
            }),
            m("button", {onclick:  function(value){
                            //Host.vm.host = host;
                            Host.vm.update(Host.vm.host);
                        }}, "Save"),
    ]);
};


var Hosts = function(){};
Hosts.list = m.prop([]);
Hosts.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
}

Hosts.storage = mx.storage('Hosts', mx.LOCAL_STORAGE);
Hosts.store = function(value) {
    if (value instanceof Array) {
        console.log(Hosts.list(), value);
        console.log('Length',Hosts.list().length);
        Hosts.list(Hosts.list().concat(value));
        console.log(Hosts.list(), value);
        //console.log(local);
        //console.log(local);
        //console.log(Hosts.list());
        Hosts.storage.set('hostsList', Hosts.list());
        return Hosts.list();
    }
    if (!value && localStorage.getItem('hostsList') !== null) {
        console.log('Fetching from localStorage');
        Hosts.storage.get('hostsList').forEach(function(element){
            Hosts.list().push(new Host(element));
        });

        return true;
    }
}

Hosts.getList = function(direction=false) {
    var base = "http://127.0.0.1:8000";
    var end = "/hosts";

    if (Hosts.api.total !== undefined && Hosts.list().length == Hosts.api.total) {
        return;
    }

    if (!direction) {
        if (Hosts.store()) {
            m.redraw();
            return;
        }
    }

    url = base+end;
    if (direction == "next") {
        if (!Hosts.api.next) {
            return;
        }
        url = base+Hosts.api.next;
    }
    if (direction == "previous") {
        if (!Hosts.api.previous) {
            return;
        }
        url = base+Hosts.api.previous;
    }
    if (direction == "last") {
        url = base+Hosts.api.last;
    }
    console.log(url);

    console.log(Hosts.api.total);
    console.log(Hosts.list().length);
    m.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function(response) {
            Hosts.api.initial = false;
            Hosts.api.next = response["hydra:nextPage"] || false;
            Hosts.api.previous = response["hydra:previousPage"] || false;
            Hosts.api.last = response["hydra:lastPage"];
            Hosts.api.first = response["hydra:firstPage"];
            Hosts.api.total = response["hydra:totalItems"];
            console.log(Hosts.api.total);
            console.log(Hosts.list().length);
            return response["hydra:member"];
        },
        type: Host
    }).then(log)
    .then(Hosts.store)
    .then(m.redraw)
    .then(function(data){
        // while debugging other stuff disable this
        Hosts.getList('next');
    });
}

Hosts.vm = (function() {
    var vm = {}
    vm.init = function() {
        Hosts.getList();
        vm.list = Hosts.list;
    }
    vm.next = function() {
        Hosts.getList("next");
    }
    vm.previous = function() {
        Hosts.getList("previous");
    }
    vm.last = function() {
        Hosts.getList("last");
    }
    vm.first = function() {
        Hosts.getList("first");
    }

    vm.update = function(data) {
        Host.vm.update(data);
    }
    return vm
}())

Hosts.controller = function() {
    Hosts.vm.init();
}

Hosts.view = function() {
    return m("div", [
            m("table", sorts(Hosts.list()), [
                m("thead", [
                    m("tr", [
                        m("th[data-sort-by=ip]", {}, 'IP'),
                        m("th[data-sort-by=domain]", {}, 'Domain'),
                        m("th[data-sort-by=host]", {}, 'Host'),
                        m("th[data-sort-by=hostname]", {}, 'Hostname'),
                        m("th[data-sort-by=created]", {}, 'Created'),
                        m("th[data-sort-by=updated]", {}, 'Updated'),
                    ])
                ]),
                Hosts.vm.list().map(function(host, index, array) {
                    return m("tr[data-id="+host.ip()+"]", {
                            onclick: m.withAttr("data-id", function(value){
                                Host.vm.select(host);
                            })
                        }, [
                        m("td", {}, host.ip()),
                        m("td", {}, host.domain()),
                        m("td", [m("input", {onchange: m.withAttr("value", function(value){
                            host.host(value);
                            Hosts.vm.update(host);
                        }), value: host.host()})]),
                        m("td", {}, host.hostname()),
                        m("td", {}, host.created()),
                        m("td", {}, host.updated()),
                    ])
                })
            ])
    ]);
};

var ansible = {};

ansible.controller = function() {
    var ctrl = this;

    ctrl.list = new Hosts.controller();
    ctrl.host = new Host.controller();
}

ansible.view = function(ctrl) {
    return m(".row", [
        m(".col-md-3", [ Host.vm.host.ip() ? Host.view(ctrl.host) : '' ]),
        m(".col-md-9", [
            Hosts.view(ctrl.list)
        ])
    ]);
}

m.module(document.body, ansible);
//initialize the application
//m.mount(document.body, {controller: Hosts.controller, view: Hosts.view});
//m.mount(document.body, [
//    {controller: Hosts.controller, view: Hosts.view},
////    {controller: Host.controller, view: Host.view}
//]);
