(ns octaview.main
  "Main entry for octaview (wrapped by launch.clj)."
  (:require
   (compojure [core :refer [defroutes]]
              [handler :as handler]
              [route :as route])
   [ring.adapter.jetty :as jetty]
   (octaview.api [services :refer [services-routes]])
   [octaview.config :as config :refer [cnf]]))

(defroutes all-routes
  services-routes
  (route/resources "/" {:root "public"}))

(defn wrap-cache-vendored
  "Middleware to mark vendored libraries for caching, since they
include version strings."
  [handler]
  (fn handle
    [request]
    (let [response (handler request)]
      (if (.startsWith (:uri request) "/vendor/")
        (assoc-in response
                  [:headers "Cache-Control"]
                  "max-age=900")
        response))))

(def app "Server entrance point."
  (-> (handler/site all-routes)
      (wrap-cache-vendored)))

(defn start-server
  "Start server. Call .stop on return value to stop server."
  []
  (let [port (cnf :port)]
    (printf "Running octaview: http://localhost:%s/index.html\n" port)
    (jetty/run-jetty #'app {:port port
                            :join? false})))

(def jetty
  "The jetty that was started by -main."
  (atom nil))

(defn -main [settings-path]
  (config/load! settings-path)
  (reset! jetty (start-server)))
