var Login = function () {};
Login.vm = function () {
    var vm = this;

    vm.auth = Login.auth;

    return vm;
};

Login.storage = mx.storage("Login", mx.SESSION_STORAGE);
Login.token = function(token) {
    console.log("Login.token function");
    if (token) {
        Login.storage.set("token", token);
        Login.storage.set("token_time", new Date());
    }

    if ((new Date() - (new Date(Login.storage.get("token_time")) || new Date())) / (1000 * 60) >= 59) {
        console.log("Token is nearly an hour old, delete it");
        Login.storage.remove("token");
        Login.storage.remove("token_time");
        var href = window.location.href.split("/").reverse()[0];
        if (m.route() !== "/login") {
            console.log("redirecting to /login");
            m.route("/login");
            m.redraw();
        }
    } else {
        console.log("Token is less then an hour old.");
    }

    return Login.storage.get("token");
};

Login.user = {
    email: m.prop(""),
    password: m.prop("")
};
Login.error = m.prop("");

Login.auth = function() {
    var url = uiConfig.loginUrl;
    Login.error("");
    m.redraw();

    var data = {"email": Login.user.email(), "password": Login.user.password()};
    m.request({
        method: "POST",
        url: url,
        data: data,
        serialize: function(data) { return m.route.buildQueryString(data); },
        config: function(xhr) {
            xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        }
    }).then(function(response){
        //Login.storage.set("token", response.token);
        console.log(response);
        Login.token(response.token);
        Login.user.email("");
        Login.user.password("");
        m.route("/hosts");
        HostsController.vm.init();
        GroupsController.vm.init();
        m.redraw();
    }).catch(function(response) {
        Login.error(response.message);
        m.redraw();
    });
};

Login.controller = function () {
    var ctrl = this;
    ctrl.vm = Login.vm();
};
Login.view = function(ctrl) {
    var vm = ctrl.vm;
    return m("div", {class:"container"}, [
        m("div", {class:"panel panel-default"}, [
            m("div", {class:"panel-heading"}, [
                m("h3", {class:"panel-title"}, "Please sign in"),
            ]),
            m("div", {class:"panel-body"}, [
                m("div", {class:"form-signin"}, [
                    m("label", {for:"inputEmail", class:"sr-only"}, "Email address"),
                    m("input", {type:"email", id:"inputEmail", class:"form-control", placeholder:"Email address", required:"required", oninput: m.withAttr("value", Login.user.email)}),
                    m("label", {for:"inputPassword", class:"sr-only"}, "Password"),
                    m("input", {type:"password", id:"inputPassword", class:"form-control", placeholder:"Password", required:"required", oninput: m.withAttr("value", Login.user.password)}),
                    (function() { if (Login.error()) { return m("div", {class:"alert alert-danger"}, Login.error());} })(),
                    m("button", {class:"btn btn-lg btn-primary btn-block", onclick: vm.auth}, "Sign in")
                ])
            ])
        ])
    ]);
};
