Feature: Happy Customer Journey
  As an API consumer
  I want to experience the best case scenario
  so that it keeps me happy

  Background: User is authenticated
    Given the API url "/user"
     When I send a "POST" request to the url
     Then return the status "200"
      And return a json object with
        | Property     |
        | user_id      |
        | access_token |

  Scenario: Retrieve email address of local authorities
    Given the API url "/report/district"
      And the zipcode "10711"
     When I send a "GET" request to the url
     Then return the status "200"
      And return a json object with
        | Property            |
        | public_order_office |

  Scenario: Get recommendations for violation and severity type
    Given the API url "/analyze/data"
      And a request header "Content-Type" with "application/json"
      And a request body with:
        """
        {
          "user_id": "{{user_id}}",
          "time": 1605481357079,
          "location": {
            "latitude": 52.550081,
            "longitude": 13.370763
          }
        }
        """
     When I send a "POST" request to the url
     Then return the status "200"
      And return a violation json array

  Scenario: Get an image token
    Given the API url "/analyze/image/upload?quantity=1"
     When I send a "GET" request to the url
     Then return the status "200"
      And return a json object with
        | Property          |
        | token             |
        | google_cloud_urls |

  Scenario: Upload an image
    Given an image upload url
      And a request body with the file "test_image.jpg"
      And a request header "Content-Type" with "image/jpeg"
     When I send a "PUT" request to the url
     Then return the status "200"

  Scenario: Get suggestions for car attributes
    Given the API url "/analyze/image"
      And an image token
     When I send a "GET" request to the url
     Then return the status "200"
      And return a json object with
        | Property    |
        | suggestions |

  Scenario: Create a report
    Given the API url "/report"
      And a request header "Content-Type" with "application/json"
      And a request body with:
        """
        {
          "user_id": "{{user_id}}",
          "report": {
            "violation_type": 1,
            "severity_type": 0,
            "time": 1606756404,
            "location": {
              "latitude": 52.550081,
              "longitude": 13.370763
            },
            "image_token": "{{token}}"
          },
          "zipcode": "10711"
        }
        """
     When I send a "POST" request to the url
     Then return the status "200"

  Scenario: Delete an user account
    Given the API url "/user"
      And an user id
     When I send a "DELETE" request to the url
     Then return the status "200"
