/*
 * Copyright by LunaSec (owned by Refinery Labs, Inc)
 *
 * Licensed under the Business Source License v1.1
 * (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * https://github.com/lunasec-io/lunasec/blob/master/licenses/BSL-LunaTrace.txt
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, { useContext, useEffect } from 'react';
import { Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { BsGithub } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

import api from '../../../api';
import { ConditionallyRender } from '../../../components/utils/ConditionallyRender';
import { GithubAppUrl } from '../../../constants';
import { WizardOpenContext } from '../../../contexts/WizardContext';
import useSidebar from '../../../hooks/useSidebar';

interface WizardProps {
  compact: boolean;
}

export const SetupWizard: React.FunctionComponent<WizardProps> = ({ compact }) => {
  const wizardOpen = useContext(WizardOpenContext);
  const { isOpen, setIsOpen } = useSidebar();
  const navigate = useNavigate();
  const [createPersonalProjectMutation, createPersonalProjectMutationResult] =
    api.useInsertPersonalProjectAndOrgMutation();

  // Send the user straight to their new project if they click the "personal project" button
  useEffect(() => {
    if (createPersonalProjectMutationResult.isSuccess) {
      const personalProjectId = createPersonalProjectMutationResult.data.insert_organizations_one?.projects[0].id;
      if (personalProjectId) {
        navigate(`/project/${personalProjectId}`);
      }
    }
  }, [createPersonalProjectMutationResult.isSuccess]);

  const hasProjects = !wizardOpen;
  return (
    <>
      <Card className="">
        <Card.Body className={compact ? '' : 'm-md-4'}>
          <Card.Title>
            {' '}
            <Badge className="me-1" pill>
              1
            </Badge>{' '}
            Connect <span className="darker">to Github.</span>
          </Card.Title>
          <Card.Subtitle className="darker homepage-subtitle left-bar-border active">
            Connect LunaTrace to at least one repo you would like to scan. You can always add more later.
          </Card.Subtitle>
          <Card.Title>
            {' '}
            <Badge className="me-1" bg={hasProjects ? 'primary' : 'secondary'} pill>
              2
            </Badge>{' '}
            Configure <span className="darker">your project.</span>
          </Card.Title>
          <Card.Subtitle className={`darker homepage-subtitle left-bar-border ${hasProjects ? 'active' : ''}`}>
            Click your imported project in the sidebar.
          </Card.Subtitle>
          <Card.Title>
            {' '}
            <Badge className="me-1" bg={hasProjects ? 'primary' : 'secondary'} pill>
              3
            </Badge>{' '}
            PR Scanning is Active!
          </Card.Title>
          <Card.Subtitle className={`darker homepage-subtitle ${hasProjects ? 'active' : ''}`}>
            Set up manual scans in your project if desired.
          </Card.Subtitle>

          <Row className="justify-content-center">
            <Col md={compact ? '12' : '6'} className="d-grid gap-2">
              {hasProjects ? (
                <Button variant="light" size="lg" onClick={() => navigate('/project/import')}>
                  <BsGithub className="mb-1 me-1" /> {'Add more projects'}
                </Button>
              ) : (
                <Button variant="primary" size="lg" href={GithubAppUrl}>
                  <BsGithub className="mb-1 me-1" /> {'Connect to GitHub'}
                </Button>
              )}
              <ConditionallyRender if={!hasProjects}>
                {createPersonalProjectMutationResult.isLoading ? (
                  <Spinner animation="border" variant="primary" />
                ) : (
                  <Card.Subtitle className="darker">
                    Prefer not to? If you would like to do manual scans without GitHub,{' '}
                    <span onClick={() => createPersonalProjectMutation({})} className="link-primary cursor-pointer">
                      click here to create an unlinked project
                    </span>
                    .
                  </Card.Subtitle>
                )}
              </ConditionallyRender>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};
