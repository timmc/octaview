(ns octaview.api.services
  "API endpoints for loading services."
  (:require [cheshire.core :as json]
            [compojure.core :refer [defroutes GET]]
            [octaview.config :as config :refer [cnf]])
  (:import (java.io File)))

(defn read-one-descriptor
  "Read a service descriptor from disk, yielding one of:

- [:service <Map>] on success
- [:error {:error_code <String>,
           :error_subcode <String?>,
           :message <String>}]"
  [^File f]
  (try
    (let [data (json/parse-string (slurp f :encoding "UTF-8") false)]
      ;; Very basic validation
      (if-not (contains? data "id")
        [:error {:error_code "INVALID"
                 :error_subcode "FIELD_ID"
                 :message (str "Invalid descriptor, missing id: "
                               (.getName f))}]
        [:service data]))
    (catch com.fasterxml.jackson.core.JsonProcessingException jpe
      [:error {:error_code "BAD_FORMAT"
               :message (str "Could not parse: " (.getName f))}])
    (catch java.io.IOException ioe
      [:error {:error_code "FAILED_READ"
               :message (str "Could not read: " (.getName f))}])))

(defn read-service-descriptors
  "Read all service descriptors, yielding coll of service-or-error
values (see read-one-descriptor)."
  []
  (let [d (config/resolve-rel-settings (cnf :descriptors-dir))]
    (for [f (.listFiles d)
          :when (.endsWith (.getName f) ".json")]
      (read-one-descriptor f))))

(defn services-data
  "Produce a map of :services (list of service maps), :errors (for
services that could not be loaded or validated),
and :data-timestamp-ms (an approximate timestamp of data age.)"
  []
  (let [by-status (group-by first (read-service-descriptors))]
    {:services (map second (:service by-status))
     :errors (map second (:error by-status))
     :data-timestamp-ms (System/currentTimeMillis)}))

(defroutes services-routes
  ;; JSON map of:
  ;; - services: Array of service descriptor maps
  ;; - errors: Array of error maps with key error_code
  ;;
  ;; Status is 200 even if there are some errors and no successes.
  (GET "/api/services" []
       {:status 200
        :headers {"Content-Type" "application/json"}
        :body (json/generate-string (services-data))}))
