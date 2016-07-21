(ns octaview.api.monitors
  "API endpoints for loading monitoring data."
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [compojure.core :refer [defroutes GET]]
            [org.httpkit.client :as http]
            [octaview.config :as config :refer [cnf]]))

;;;; Datadog

;; TODO Read from file at configured path
(def datadog-api-key
  (slurp (io/resource "datadog.api.key") :encoding "UTF-8"))

(def datadog-application-key
  (slurp (io/resource "datadog.application.key") :encoding "UTF-8"))

(defn datadog-query
  "Make a request to datadog"
  [path query-params]
  (let [auth {"api_key" datadog-api-key,
              "application_key" datadog-application-key}]
    (update-in
     @(http/get (str "https://app.datadoghq.com" path)
                {:timeout 5000
                 :query-params (merge query-params auth)
                 :user-agent (str "Octaview/" (config/read-own-version))})
     [:body]
     json/parse-string)))

;;;; Caching

(def cache
  "Generic through-cache: Map of cache-keys to entries; an entry is a
map of :data to arbitrary data and :timestamp-ms to a
millisecond-precision timestamp."
  (atom {}))

(defn through-cache
  "Simple through-cache function: If the cached value for the
cache-key is less than max-age-ms millis old, use it, else call
fetch-f with no arguments and cache and return that."
  [cache-key max-age-ms fetch-f]
  (let [{:keys [data timestamp-ms] :as entry} (get @cache cache-key)
        now (System/currentTimeMillis)]
    (if (and entry (< now (+ timestamp-ms max-age-ms)))
      data
      (let [response (fetch-f)]
        (swap! cache assoc-in [cache-key] {:data response
                                           :timestamp-ms now})
        response))))

;;;; Monitors API

(defn process-one-monitor
  [monitor]
  ;; TODO Return an informative failure instead of nil
  (let [{:strs [query]} monitor]
    ;; TODO Document what's going on here (maybe even find a better
    ;; approach)
    (when-let [tags-query (second (re-find #".*?\{(.*?)\}.*" query))]
      (let [tags (apply merge
                        (keep #(let [[k v] (.split % ":" 2)]
                                 (when v {k v}))
                              (.split tags-query ",")))]
        {:tags tags
         :attrs (select-keys monitor ["id" "name" "overall_state" "type"])}))))

(defn monitors-data
  []
  (let [resp (through-cache "monitors" 15000
                            #(datadog-query "/api/v1/monitor" {}))]
    ;; TODO Return information failure
    (if (= (:status resp) 200)
      ;; TODO Convert failed processings into error listing
      (keep process-one-monitor
            (:body resp))
      {:error (:status resp)})))

(defroutes monitors-routes
  (GET "/api/monitors-test" []
       {:status 200
        :headers {"Content-Type" "application/json"}
        :body (json/generate-string (monitors-data))}))
