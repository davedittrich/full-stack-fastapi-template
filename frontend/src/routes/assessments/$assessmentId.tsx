import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  Divider,
  Grid,
  GridItem,
  Card,
  CardBody,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { FiArrowLeft, FiEdit, FiHelpCircle } from "react-icons/fi"

import { type AssessmentPublic } from "../../client"
import { AssessmentsService, ChallengesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/assessments/$assessmentId")({
  component: AssessmentDetails,
})

function AssessmentDetails() {
  const { assessmentId } = Route.useParams()
  const router = useRouter()
  const showToast = useCustomToast()
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    data: assessment,
    isPending: assessmentLoading,
    isError: assessmentError,
    error: assessmentErrorDetails,
  } = useQuery({
    queryKey: ["assessments", assessmentId],
    queryFn: () => AssessmentsService.readAssessment({ id: assessmentId }),
  })

  const {
    data: challenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  if (assessmentLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (assessmentError) {
    const errDetail = (assessmentErrorDetails?.body as any)?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
    return (
      <Container maxW="2xl">
        <Alert status="error">
          <AlertIcon />
          Failed to load assessment details.
        </Alert>
      </Container>
    )
  }

  const challenge = challenges?.data.find(c => c.id === assessment?.challenge_id)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'green'
      case 'hard': return 'red'
      default: return 'yellow'
    }
  }

  return (
    <Container maxW="4xl">
      <Flex justify="space-between" align="center" py={8}>
        <Button
          onClick={() => router.history.back()}
          leftIcon={<FiArrowLeft />}
          variant="ghost"
        >
          Back
        </Button>
        <Flex gap={2}>
          <Button
            as={Link}
            to="/assessments/$assessmentId/edit"
            params={{ assessmentId }}
            leftIcon={<FiEdit />}
            colorScheme="ui.main"
            variant="outline"
          >
            Edit
          </Button>
        </Flex>
      </Flex>

      {assessment && (
        <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <Box textAlign="center" w="full">
            <Heading size="lg" mb={4}>
              Assessment Details
            </Heading>
            <Flex justify="center" gap={4} mb={6} wrap="wrap">
              <Badge
                colorScheme={assessment.is_active ? "green" : "gray"}
                variant={assessment.is_active ? "solid" : "outline"}
                fontSize="sm"
                px={3}
                py={1}
              >
                {assessment.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="sm"
                px={3}
                py={1}
              >
                {assessment.question_type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || 'Short Answer'}
              </Badge>
              <Badge
                colorScheme={getDifficultyColor(assessment.difficulty || 'medium')}
                variant="outline"
                fontSize="sm"
                px={3}
                py={1}
              >
                {assessment.difficulty?.charAt(0).toUpperCase() + assessment.difficulty?.slice(1) || 'Medium'}
              </Badge>
              <Badge
                colorScheme="green"
                variant="subtle"
                fontSize="sm"
                px={3}
                py={1}
              >
                {assessment.points || 10} Points
              </Badge>
            </Flex>
          </Box>

          <Divider />

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8} w="full">
            <GridItem>
              <VStack align="start" spacing={6}>
                <Box>
                  <Heading size="md" mb={3}>Question</Heading>
                  <Card>
                    <CardBody>
                      <Text whiteSpace="pre-wrap">
                        {assessment.question_text}
                      </Text>
                    </CardBody>
                  </Card>
                </Box>

                {assessment.answer_text && (
                  <Box>
                    <Heading size="md" mb={3}>Answer (Lecturers/Admins Only)</Heading>
                    <Card bg="red.50" borderLeft="4px solid" borderLeftColor="red.500">
                      <CardBody>
                        <Text whiteSpace="pre-wrap" color="red.700">
                          {assessment.answer_text}
                        </Text>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {assessment.hint_text && (
                  <Box>
                    <Heading size="md" mb={3}>
                      <Flex align="center" gap={2}>
                        <FiHelpCircle />
                        Hint for Students
                      </Flex>
                    </Heading>
                    <Card bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
                      <CardBody>
                        <Text whiteSpace="pre-wrap" color="blue.700">
                          {assessment.hint_text}
                        </Text>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {assessment.flag_format && (
                  <Box>
                    <Heading size="md" mb={3}>Flag Format</Heading>
                    <Card>
                      <CardBody>
                        <Text fontFamily="mono" bg="gray.100" p={2} borderRadius="md">
                          {assessment.flag_format}
                        </Text>
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" spacing={6}>
                <Box w="full">
                  <Heading size="md" mb={3}>Assessment Information</Heading>
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Text fontWeight="medium" color="gray.500" fontSize="sm">Challenge</Text>
                          <Text>
                            {challenge ? (
                              <Link
                                to="/challenges/$challengeId"
                                params={{ challengeId: challenge.id }}
                                style={{ color: "var(--chakra-colors-ui-main)" }}
                              >
                                {challenge.title}
                              </Link>
                            ) : (
                              "No challenge assigned"
                            )}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" color="gray.500" fontSize="sm">Created</Text>
                          <Text fontSize="sm">
                            {new Date(assessment.created_at).toLocaleDateString()} at{" "}
                            {new Date(assessment.created_at).toLocaleTimeString()}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" color="gray.500" fontSize="sm">Last Updated</Text>
                          <Text fontSize="sm">
                            {new Date(assessment.updated_at).toLocaleDateString()} at{" "}
                            {new Date(assessment.updated_at).toLocaleTimeString()}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" color="gray.500" fontSize="sm">Assessment ID</Text>
                          <Text fontSize="xs" fontFamily="mono" color="gray.500">
                            {assessment.id}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      )}
    </Container>
  )
}