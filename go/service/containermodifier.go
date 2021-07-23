package service

import (
	"log"
	"strings"

	"github.com/google/go-containerregistry/pkg/crane"
	v1 "github.com/google/go-containerregistry/pkg/v1"
	"github.com/google/go-containerregistry/pkg/v1/mutate"
)

type DockerContainerModifier interface {
	LoadImageFromFile() (base v1.Image, err error)
	LoadImageFromRemote() (base v1.Image, err error)
	PushImageToRemote(img v1.Image, tag string) (err error)
	AppendLayersToBaseImage(base v1.Image, appendLayers []v1.Layer) (img v1.Image, err error)
	SaveImageToFile(img v1.Image, newTag, filename string) (err error)
	GetImageDeploymentID(img v1.Image) (deploymentID string, err error)
}

type dockerContainerModifier struct {
	baseRef          string
	modifyEntrypoint bool
	dockerManager DockerManager
}

func NewDockerContainerModifier(
	baseRef string,
	modifyEntrypoint bool,
	dockerManager DockerManager,
) DockerContainerModifier {
	return &dockerContainerModifier{
		baseRef:          baseRef,
		modifyEntrypoint: modifyEntrypoint,
		dockerManager: dockerManager,
	}
}

func (d *dockerContainerModifier) LoadImageFromFile() (base v1.Image, err error) {
	return crane.Load(d.baseRef)
}

func (d *dockerContainerModifier) LoadImageFromRemote() (base v1.Image, err error) {
	return d.dockerManager.PullImage(d.baseRef)
}

func (d *dockerContainerModifier) PushImageToRemote(img v1.Image, tag string) (err error) {
	return d.dockerManager.PushImage(img, tag)
}

func (d *dockerContainerModifier) AppendLayersToBaseImage(base v1.Image, appendLayers []v1.Layer) (img v1.Image, err error) {
	log.Printf("appending %v layers to %s", len(appendLayers), d.baseRef)
	img, err = mutate.AppendLayers(base, appendLayers...)
	if err != nil {
		log.Println(err)
		return
	}

	configFile, err := img.ConfigFile()
	if err != nil {
		log.Println(err)
		return
	}

	if d.modifyEntrypoint {
		img, err = modifyImageEntrypoint(img, configFile)
		if err != nil {
			log.Println(err)
			return
		}
	}
	return
}

func (d *dockerContainerModifier) GetImageDeploymentID(img v1.Image) (deploymentID string, err error) {
	configFile, err := img.ConfigFile()
	if err != nil {
		log.Println(err)
		return
	}

	deploymentID = getDeploymentIDFromConfig(configFile)
	return
}

func (d *dockerContainerModifier) SaveImageToFile(img v1.Image, newTag, filename string) (err error) {
	return crane.Save(img, newTag, filename)
}

func getDeploymentIDFromConfig(configFile *v1.ConfigFile) (deploymentID string) {
	for _, envVar := range configFile.Config.Env {
		if strings.Index(envVar, "REFINERY_DEPLOYMENT_ID") == 0 {
			parts := strings.Split(envVar, "=")
			deploymentID = parts[len(parts)-1]
		}
	}
	return
}

func modifyImageEntrypoint(img v1.Image, configFile *v1.ConfigFile) (newImg v1.Image, err error) {
	configFile.Config.Entrypoint = []string{"/var/runtime/bootstrap"}
	return mutate.ConfigFile(img, configFile)
}
