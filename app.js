var log = function(value) {
    if (value instanceof Array) {
        console.log('is an array');
    }
    console.log(value)
    return value
}

var Host = function(data) {
    this.created = m.prop(data.created);
    this.domain = m.prop(data.domain);
    this.enabled = m.prop(data.enabled);
    this.host = m.prop(data.host);
    this.hostname = m.prop(data.hostname);
    this.updated = m.prop(data.updated);
    this.ip = m.prop(data.ip);
};

Host.list = m.prop([]);
Host.api = {
    first: false,
    next: false,
    previous: false,
    last: false
}

Host.getList = function(direction=false) {
    var base = "http://127.0.0.1:8000";
    var end = "/hosts";

    url = base+end;
    if (direction == "next") {
        if (!Host.api.next) {
            return;
        }
        url = base+Host.api.next;
    }
    if (direction == "previous") {
        if (!Host.api.previous) {
            return;
        }
        url = base+Host.api.previous;
    }
    if (direction == "last") {
        url = base+Host.api.last;
    }
    console.log(url);

    m.request({
        method: "GET",
        url: url,
        unwrapSuccess: function(response) {
            Host.api.next = response["hydra:nextPage"] || false;
            Host.api.previous = response["hydra:previousPage"] || false;
            console.log(Host.api.next);
            console.log(Host.api.previous);
            Host.api.last = response["hydra:lastPage"];
            Host.api.first = response["hydra:firstPage"];
            console.log(response);
            return response["hydra:member"];
        },
        type: Host
    }).then(log)
    .then(Host.list)
    .then(m.redraw());
}

Host.vm = (function() {
    var vm = {}
    vm.init = function() {
        Host.getList();
        vm.list = Host.list;
    }
    vm.next = function() {
        Host.getList("next");
    }
    vm.previous = function() {
        Host.getList("previous");
    }
    vm.last = function() {
        Host.getList("last");
    }
    vm.first = function() {
        Host.getList("first");
    }
    return vm
}())

Host.controller = function() {
    Host.vm.init();
}

Host.view = function() {
    return m("html", [
        m("body", [
            m("button", {onclick: Host.vm.first}, "First"),
            m("button", {onclick: Host.vm.previous, disabled: !Host.api.previous}, "Previous"),
            m("button", {onclick: Host.vm.next, disabled: !Host.api.next}, "Next"),
            m("button", {onclick: Host.vm.last}, "Last"),
            m("table", [
                m("thead", [
                    m("tr", [
                        m("td", {}, 'IP'),
                        m("td", {}, 'Domain'),
                        m("td", {}, 'Host'),
                        m("td", {}, 'Hostname'),
                        m("td", {}, 'Created'),
                        m("td", {}, 'Updated'),
                    ])
                ]),
                Host.vm.list().map(function(host, index, array) {
                    return m("tr", [
                        m("td", {}, host.ip()),
                        m("td", {}, host.domain()),
                        m("td", {}, host.host()),
                        m("td", {}, host.hostname()),
                        m("td", {}, host.created()),
                        m("td", {}, host.updated()),
                    ])
                })
            ])
        ])
    ]);
};

//initialize the application
m.mount(document, {controller: Host.controller, view: Host.view});
