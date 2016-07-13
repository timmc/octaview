(ns app-2542.main
  "Main entry for app-2542 (wrapped by launch.clj)."
  (:require
   (compojure [core :refer [defroutes]]
              [handler :as handler]
              [route :as route])
   [ring.adapter.jetty :as jetty]
   (app-2542.api [services :refer [services-routes]])
   [app-2542.config :as config :refer [cnf]]))

(defroutes all-routes
  services-routes
  (route/resources "/" {:root "public"}))

(def app "Server entrance point."
  (handler/site all-routes))

(defn start-server
  "Start server. Call .stop on return value to stop server."
  []
  (let [port (cnf :port)]
    (printf "Running app-2542: http://localhost:%s/index.html\n" port)
    (jetty/run-jetty #'app {:port port
                            :join? false})))

(def jetty
  "The jetty that was started by -main."
  (atom nil))

(defn -main [settings-path]
  (config/load! settings-path)
  (reset! jetty (start-server)))
