Feature: Happy User Journey
  In order to send reports to authorities
  As a reporter
  I want context information for any data I upload

  Scenario: authenticate
    Given I created an user account
    When I send a deletion request
    Then my data should be deleted

  Scenario: zipcode
    When I send a zipcode
    Then I should get the email address from the corresponding authorities

  Scenario: violation type
    Given I created an user account
    When I send a request for violation recommendation
    Then I should get a list of violations

  Scenario: image upload
    When I send a request for an upload url
    And I upload an image
    Then I should get an image token

  Scenario: image analysis
    When I send a request for an upload url
    And I upload an image
    And I send a request with an image token
    Then I should get suggestions for license plate number, car color, make and model

  Scenario: report
    Given I created an user account
    When I send a request for an upload url
    And I upload an image
    When I send a request for report generation
    Then the report should be created