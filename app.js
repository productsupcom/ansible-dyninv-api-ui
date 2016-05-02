var log = function(value) {
    if (value instanceof Array) {
        console.log('is an array');
    }
    console.log(value)
    return value
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
    //console.log(this.ip());
};

Host.update = function(host) {
    console.log(host.id());

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

    vm.update = function(data) {
        Hosts.update(data);
    }
    return vm
}())

Host.controller = function() {
    Host.vm.init();
}

Host.view = function() {
    return m("form", [
            //Host.vm.host().map(function(property, index) {
            //    m("div", [
            //        m("input", {}, value:property.value),
            //    ]);
            //}),
            //m("button", {onclick: Host.vm.save}, "Save"),
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
        Hosts.update(data);
    }
    return vm
}())

Hosts.controller = function() {
    Hosts.vm.init();
}

Hosts.view = function() {
    return m("div", [
            //m("button", {onclick: Hosts.vm.first}, "First"),
            //m("button", {onclick: Hosts.vm.previous, disabled: !Hosts.api.previous}, "Previous"),
            //m("button", {onclick: Hosts.vm.next, disabled: !Hosts.api.next}, "Next"),
            //m("button", {onclick: Hosts.vm.last}, "Last"),
            m("table", [
                m("thead", [
                    m("tr", [
                        m("th", {}, 'IP'),
                        m("th", {}, 'Domain'),
                        m("th", {}, 'Host'),
                        m("th", {}, 'Hostname'),
                        m("th", {}, 'Created'),
                        m("th", {}, 'Updated'),
                    ])
                ]),
                Hosts.vm.list().map(function(host, index, array) {
                    return m("tr", [
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

//initialize the application
m.mount(document.body, {controller: Hosts.controller, view: Hosts.view});
//m.mount(document.body, [
//    {controller: Hosts.controller, view: Hosts.view},
////    {controller: Host.controller, view: Host.view}
//]);
