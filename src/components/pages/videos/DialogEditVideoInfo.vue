<template>
  <div v-if="$store.state.Videos.dialogEditVideoInfo">
    <v-dialog v-model="dialog" scrollable persistent max-width="1200">
      <v-card>
        <v-card-title class="edit-card-title">
          <div class="headline">
            <span class="ml-4">Edit videos info </span>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on" class="mb-4" small dark>mdi-help-circle-outline</v-icon>
              </template>
              <span>Performers, tags, and websites added in this dialog will be added to the existing ones. <br>
                Clearing information will affect the selected videos! Use this option carefully. <br>
                Click the <v-icon dark small>mdi-plus-circle-outline</v-icon> to the left of the select to add a new item.</span>
            </v-tooltip>
          </div>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.Videos.dialogEditVideoInfo=false" class="ma-4" dark outlined> Cancel </v-btn>
          <v-btn @click="saveVideoInfo" color="primary">
            <v-icon left>mdi-content-save-outline</v-icon> Save </v-btn>
        </v-card-title>
        <vuescroll>
          <v-card-text class="py-0">
            <v-container fluid>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card-actions>
                    <span class="overline ml-6"><v-icon left>mdi-account-outline</v-icon> performers</span>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Sort list by</span>
                    <v-btn-toggle v-model="sortButtonsPerformers" mandatory color="primary">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="name" v-on="on">
                            <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                          </v-btn>
                        </template>
                        <span>name</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="favorite" v-on="on">
                            <v-icon color="grey">mdi-heart-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>favorite</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="rating" v-on="on">
                            <v-icon color="grey">mdi-star-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>rating</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="date" v-on="on">
                            <v-icon color="grey">mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearPerformers"
                    v-model="performers" outlined clearable
                    :items="performersAll()" label="Performers"
                    item-text="name" class="hidden-close"
                    item-value="name" no-data-text="No more performers"
                    @blur="sort('performers')" multiple hide-selected hide-details  
                    @click:prepend="dialogAddNewPerformer=true" prepend-icon="mdi-plus-circle-outline"
                    :menu-props="{contentClass:'list-with-preview'}" :filter="filterItems"
                  >
                    <template v-slot:selection="data">
                      <v-chip v-bind="data.attrs" close close-icon="mdi-close"
                        :input-value="data.selected" label class="px-2"
                        @click="data.select" @click:close="removeItem(data.item, 'performers')"
                        @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > <span> <v-icon v-if="data.item.favorite" small color="pink">
                        mdi-heart </v-icon> {{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item"
                        @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > 
                        <v-icon 
                          left size="14" 
                          :color="data.item.favorite===false ? 'grey' : 'pink'"
                        >
                          mdi-heart
                        </v-icon>
                        <v-rating 
                          class="rating-inline small mr-2"
                          v-model="data.item.rating"
                          color="yellow darken-3"
                          background-color="grey darken-1"
                          empty-icon="$ratingFull" 
                          half-icon="mdi-star-half-full"
                          dense half-increments readonly size="12"
                        />
                        <span>{{data.item.name}}</span>
                        <span v-if="data.item.aliases.length" class="aliases"> 
                          aka {{data.item.aliases.join(', ').slice(0,80)}}
                        </span>
                      </div>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card-actions>
                    <span class="overline ml-6"><v-icon left>mdi-tag-outline</v-icon> tags</span>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Sort list by</span>
                    <v-btn-toggle v-model="sortButtonsTags" mandatory color="primary">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="name" v-on="on">
                            <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                          </v-btn>
                        </template>
                        <span>name</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="favorite" v-on="on">
                            <v-icon color="grey">mdi-heart-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>favorite</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="color" v-on="on">
                            <v-icon color="grey">mdi-palette</v-icon>
                          </v-btn>
                        </template>
                        <span>color</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="date" v-on="on">
                            <v-icon color="grey">mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearTags"
                    v-model="tags" outlined clearable
                    :items="tagsAll()" label="Tags"
                    item-text="name" class="hidden-close"
                    item-value="name" no-data-text="No more tags"
                    multiple hide-selected hide-details
                    @click:prepend="dialogAddNewTag=true" prepend-icon="mdi-plus-circle-outline"
                    @blur="sort('tags')" :menu-props="{contentClass:'list-with-preview'}"
                    :filter="filterItems"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" close
                        :input-value="data.selected" 
                        @click="data.select" text-color="white"
                        @click:close="removeItem(data.item, 'tags')" close-icon="mdi-close"
                        @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                        :color="getTag(data.item.name).color" 
                      > <span>{{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item"
                        @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                          left size="14"> mdi-heart </v-icon>
                        <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                        <span>{{data.item.name}}</span>
                        <span v-if="data.item.altNames.length" class="aliases"> 
                          {{data.item.altNames.join(', ').slice(0,80)}}
                        </span>
                      </div>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card-actions>
                    <span class="overline ml-6"><v-icon left>mdi-web</v-icon> websites</span>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Sort list by</span>
                    <v-btn-toggle v-model="sortButtonsWebsites" mandatory color="primary">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="name" v-on="on">
                            <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                          </v-btn>
                        </template>
                        <span>name</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="favorite" v-on="on">
                            <v-icon color="grey">mdi-heart-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>favorite</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="color" v-on="on">
                            <v-icon color="grey">mdi-palette</v-icon>
                          </v-btn>
                        </template>
                        <span>color</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="date" v-on="on">
                            <v-icon color="grey">mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearWebsites"
                    v-model="websites" outlined clearable
                    :items="websitesAll()" label="Websites"
                    item-text="name" class="mt-0 hidden-close" 
                    item-value="name" multiple hide-selected hide-details
                    @click:prepend="dialogAddNewWebsite=true" prepend-icon="mdi-plus-circle-outline"
                    no-data-text="No more websites" :filter="filterItems"
                    :menu-props="{contentClass:'list-with-preview'}"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" label close close-icon="mdi-close"
                        @click="data.select" @click:close="removeItem(data.item, 'websites')" 
                        @mouseover.stop="showImage($event, data.item.id, 'website')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                        :input-value="data.selected" 
                        :color="data.item.color" text-color="white"
                      > <span>{{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item"
                        @mouseover.stop="showImage($event, data.item.id, 'website')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                          left size="14"> mdi-heart </v-icon>
                        <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                        <span>{{data.item.name}}</span>
                        <span v-if="data.item.altNames.length" class="aliases"> 
                          {{data.item.altNames.join(', ').slice(0,80)}}
                        </span>
                      </div>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="8" md="4" align="center" justify="center">
                  <div class="overline mb-3">Rating</div>
                  <v-rating style="display:inline-flex;" :readonly="clearRating"
                    v-model="rating" clearable :disabled="clearRating"
                    color="yellow darken-2"
                    background-color="grey"
                    empty-icon="mdi-star-outline"
                    half-icon="mdi-star-half-full"
                    half-increments hover size="36"
                  ></v-rating>
                </v-col>
                <v-col cols="4" md="2" align="center" justify="center">
                  <div class="overline mb-3">Favorite</div>
                  <v-btn @click="favorite=!favorite" :disabled="clearFavorite" color="pink" icon x-large>
                    <v-icon size="36" v-if="favorite===false" color="grey">mdi-heart-outline</v-icon>
                    <v-icon size="36" v-else color="pink">mdi-heart</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="12" class="mt-6 py-0">
                  <div class="overline text-center">Clear Information</div>
                  <div cols="12" class="d-flex justify-space-between">
                    <v-switch inset v-model="clearPerformers" color="red">
                      <template v-slot:label>
                        <span v-if="clearPerformers" class="red--text">
                          <v-icon left color="red">mdi-account-outline</v-icon> Performers
                        </span>
                        <span v-else>
                          <v-icon left>mdi-account-outline</v-icon> Performers
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearTags" color="red">
                      <template v-slot:label>
                        <span v-if="clearTags" class="red--text">
                          <v-icon left color="red">mdi-tag-outline</v-icon> Tags
                        </span>
                        <span v-else>
                          <v-icon left>mdi-tag-outline</v-icon> Tags
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearWebsites" color="red">
                      <template v-slot:label>
                        <span v-if="clearWebsites" class="red--text">
                          <v-icon left color="red">mdi-web</v-icon> Websites
                        </span>
                        <span v-else>
                          <v-icon left>mdi-web</v-icon> Websites
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearRating" color="red">
                      <template v-slot:label>
                        <span v-if="clearRating" class="red--text">
                          <v-icon left color="red">mdi-star-outline</v-icon> Rating
                        </span>
                        <span v-else>
                          <v-icon left>mdi-star-outline</v-icon> Rating
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearFavorite" color="red">
                      <template v-slot:label>
                        <span v-if="clearFavorite" class="red--text">
                          <v-icon left color="red">mdi-heart-outline</v-icon> Favorite
                        </span>
                        <span v-else>
                          <v-icon left>mdi-heart-outline</v-icon> Favorite
                        </span>
                      </template>
                    </v-switch>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-bottom-sheet v-model="sheet" inset scrollable persistent content-class="video-sheet">
      <v-card>
        <vuescroll>
          <v-card-text class="pa-0">
            <v-btn @click="close" class="close-btn" fab small>
              <v-icon>mdi-close</v-icon></v-btn>
            <v-responsive :aspect-ratio="16/9">
              <div class="video-container">
                <img :src="'file://' + getImg()">
                <video ref="video" autoplay loop :poster="'file://' + getImg()" muted></video>
              </div>
              <div class="gradient" :style="gradient"></div>
              <v-card-actions class="actions">
                <v-btn @click="playVideo" small outlined fab :disabled="!videoExists" :color="darkMode?'#ccc':'#777'">
                  <v-icon large>mdi-play</v-icon> </v-btn>
                <v-btn @click="toggleMuted" small outlined fab class="mr-4" :color="darkMode?'#ccc':'#777'">
                  <v-icon v-if="muted">mdi-volume-off</v-icon>
                  <v-icon v-else>mdi-volume-high</v-icon>
                </v-btn>
                <v-rating v-model="rating" clearable hover half-increments size="30"
                  :color="darkMode?'#ccc':'#777'" :background-color="darkMode?'#ccc':'#777'" 
                  empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/>
                <v-btn @click="favorite=!favorite" class="mx-2" :color="darkMode?'#ccc':'#777'" icon large> 
                  <v-icon size="25">mdi-heart{{favorite? '':'-outline'}}</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="saveVideoInfo" large outlined rounded :color="darkMode?'#ccc':'#777'" class="pr-3">
                  <v-icon left>mdi-content-save</v-icon> save </v-btn>
              </v-card-actions>
              <div class="headline video-title text--secondary text-h4">{{fileName}}</div>
              <v-btn class="file-info-icon" fab x-small>
                <v-icon>mdi-information-variant</v-icon>
              </v-btn>
              <v-card class="file-info">
                <div>
                  <v-icon left size="18">mdi-monitor-screenshot</v-icon>
                  Resolution: {{video.resolution}}
                </div>
                <div>
                  <v-icon left size="18">mdi-file-video</v-icon>
                  File extension: .{{fileExtension}}
                </div>
                <div>
                  <v-icon left size="18">mdi-harddisk</v-icon>
                  File size: {{calcSize(video.size)}}
                </div>
                <div>
                  <v-icon left size="18">mdi-calendar-plus</v-icon>
                  Added: {{added}}
                </div>
                <div>
                  <v-icon left size="18">mdi-calendar-edit</v-icon>
                  Last edit: {{edit}}
                </div>
              </v-card>
            </v-responsive>
            <v-row class="mx-2">
              <v-col v-for="(m,i) in metaInCard" :key="i+key" cols="12" sm="6">
                <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                  @input="setVal($event,m.id)" :value="values[m.id]"
                  multiple hide-selected hide-details dense
                  :label="getMeta(m.id).settings.name" item-value="id"
                  append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewCard(m.id)"
                  append-icon="mdi-chevron-down" @click:append="dialogListView=true"
                  :menu-props="{contentClass:'list-with-preview'}" class="hidden-close"
                > <!--  TODO fix filtering when type smth in search field -->
                  <template v-slot:selection="data">
                    <v-chip v-bind="data.attrs" class="my-1 px-2" small
                      @click="data.select" :input-value="data.selected"
                      @click:close="removeItemMeta(data.item.id,m.id)" close
                      :color="getColor(m.id,data.item.id)" 
                      :label="getMeta(m.id).settings.chipLabel"
                      :outlined="getMeta(m.id).settings.chipOutlined"
                      @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                      @mouseleave.stop="$store.state.hoveredImage=false">
                      <span>{{ data.item.meta.name }}</span>
                    </v-chip>
                  </template>
                  <template v-slot:item="data">
                    <div class="list-item" 
                      @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > 
                      <span v-if="getMeta(m.id).settings.favorite">
                        <v-icon :color="data.item.meta.favorite? 'pink':''" left size="14">mdi-heart</v-icon>
                      </span>
                      <span v-if="getMeta(m.id).settings.color">
                        <v-icon :color="data.item.meta.color || ''" left small>
                          mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                      </span>
                      <span>{{data.item.meta.name}}</span>
                      <span v-if="getMeta(m.id).settings.synonyms" class="aliases">
                        {{getCard(data.item.id).meta.synonyms===undefined? '' : getCard(data.item.id).meta.synonyms.join(', ').slice(0,50)}}
                      </span>
                    </div>
                  </template>
                </v-autocomplete>

                <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='string')" 
                  @input="setVal($event,m.id)" :value="values[m.id]"
                  :label="getMeta(m.id).settings.name" hide-details dense
                  clearable @click:clear="setVal('', m.id)"/>

                <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='number')" 
                  @input="setVal($event,m.id)" :value="values[m.id]" type="number"
                  :label="getMeta(m.id).settings.name" hide-details dense/>

                <v-autocomplete v-if="m.type=='simple'&&getMeta(m.id).dataType==='array'" 
                  :items="getMeta(m.id).settings.items" item-value="id" item-text="name"
                  @input="setVal($event,m.id)" :value="values[m.id]" multiple hide-details
                  :label="getMeta(m.id).settings.name" dense
                  append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewItem(m.id)"/>
                
                <v-switch v-if="m.type=='simple'&&getMeta(m.id).dataType==='boolean'" 
                  :label="getMeta(m.id).settings.name" hide-details 
                  @change="setVal($event,m.id)" :value="values[m.id]" class="ma-0"/>
                  
                <v-text-field v-if="m.type=='simple'&&getMeta(m.id).dataType==='date'" 
                  :value="values[m.id]" @click="calendarId=m.id,calendar=true" dense
                  :label="getMeta(m.id).settings.name" hint='YYYY-MM-DD' hide-details
                  clearable @click:clear="setVal('', m.id)" readonly persistent-hint/>

              </v-col>
              <v-col cols="12" class="mt-6">
                <v-card-actions>
                  <span class="mr-6">
                    <v-btn @click="dialogAddNewTag=true" icon class="mr-2">
                      <v-icon>mdi-tag-plus-outline</v-icon> 
                    </v-btn>
                    <span class="overline">tags</span>
                  </span>
                  <v-spacer></v-spacer>
                  <span class="caption mr-2">Sort list by</span>
                  <v-btn-toggle v-model="sortButtonsTags" mandatory color="primary">
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="name" v-on="on">
                          <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                        </v-btn>
                      </template>
                      <span>name</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="favorite" v-on="on">
                          <v-icon color="grey">mdi-heart-outline</v-icon>
                        </v-btn>
                      </template>
                      <span>favorite</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="color" v-on="on">
                          <v-icon color="grey">mdi-palette</v-icon>
                        </v-btn>
                      </template>
                      <span>color</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="date" v-on="on">
                          <v-icon color="grey">mdi-calendar-plus</v-icon>
                        </v-btn>
                      </template>
                      <span>date added</span>
                    </v-tooltip>
                  </v-btn-toggle>
                </v-card-actions>
                <v-autocomplete v-model="tags" :disabled="clearTags" clearable
                  :items="tagsAll()" item-text="name" class="hidden-close pt-0 mt-0"
                  item-value="name" no-data-text="No more tags"
                  multiple hide-selected hide-details
                  @blur="sort('tags')" :menu-props="{contentClass:'list-with-preview'}"
                  :filter="filterItems" 
                >
                  <template v-slot:selection="data">
                    <v-chip v-bind="data.attrs" close outlined :input-value="data.selected" 
                      @click="data.select" @click:close="removeItem(data.item, 'tags')" close-icon="mdi-close"
                      @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                      :color="getTag(data.item.name).color" 
                    > <span>{{ data.item.name }}</span>
                    </v-chip>
                  </template>
                  <template v-slot:item="data">
                    <div class="list-item"
                      @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                        left size="14"> mdi-heart </v-icon>
                      <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                      <span>{{data.item.name}}</span>
                      <span v-if="data.item.altNames.length" class="aliases"> 
                        {{data.item.altNames.join(', ').slice(0,80)}}
                      </span>
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" lg="6">
                <v-card-actions>
                  <span class="mr-6">
                    <v-btn @click="dialogAddNewPerformer=true" icon class="mr-2">
                      <v-icon>mdi-account-plus-outline</v-icon> 
                    </v-btn>
                    <span class="overline">Performers</span>
                  </span>
                  <v-spacer></v-spacer>
                  <span class="caption mr-2">Sort list by</span>
                  <v-btn-toggle v-model="sortButtonsPerformers" mandatory color="primary">
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="name" v-on="on">
                          <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                        </v-btn>
                      </template>
                      <span>name</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="favorite" v-on="on">
                          <v-icon color="grey">mdi-heart-outline</v-icon>
                        </v-btn>
                      </template>
                      <span>favorite</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="rating" v-on="on">
                          <v-icon color="grey">mdi-star-outline</v-icon>
                        </v-btn>
                      </template>
                      <span>rating</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="date" v-on="on">
                          <v-icon color="grey">mdi-calendar-plus</v-icon>
                        </v-btn>
                      </template>
                      <span>date added</span>
                    </v-tooltip>
                  </v-btn-toggle>
                </v-card-actions>
                <v-autocomplete v-model="performers" :disabled="clearPerformers" clearable
                  :items="performersAll()" item-text="name" class="hidden-close pt-0 mt-0"
                  item-value="name" no-data-text="No more performers"
                  multiple hide-selected hide-details @blur="sort('performers')" 
                  :menu-props="{contentClass:'list-with-preview'}" :filter="filterItems"
                >
                  <template v-slot:selection="data">
                    <v-chip v-bind="data.attrs" close close-icon="mdi-close"
                      :input-value="data.selected" label class="px-2" outlined
                      @click="data.select" @click:close="removeItem(data.item, 'performers')"
                      @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > <span> <v-icon v-if="data.item.favorite" small color="pink">
                      mdi-heart </v-icon> {{ data.item.name }}</span>
                    </v-chip>
                  </template>
                  <template v-slot:item="data">
                    <div class="list-item"
                      @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > 
                      <v-icon 
                        left size="14" 
                        :color="data.item.favorite===false ? 'grey' : 'pink'"
                      >
                        mdi-heart
                      </v-icon>
                      <v-rating 
                        class="rating-inline small mr-2"
                        v-model="data.item.rating"
                        color="yellow darken-3"
                        background-color="grey darken-1"
                        empty-icon="$ratingFull" 
                        half-icon="mdi-star-half-full"
                        dense half-increments readonly size="12"
                      />
                      <span>{{data.item.name}}</span>
                      <span v-if="data.item.aliases.length" class="aliases"> 
                        aka {{data.item.aliases.join(', ').slice(0,80)}}
                      </span>
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" lg="6">
                <v-card-actions>
                  <span class="mr-6">
                    <v-btn @click="dialogAddNewWebsite=true" icon class="mr-2">
                      <v-icon>mdi-plus-circle-outline</v-icon> 
                    </v-btn>
                    <span class="overline">Websites</span>
                  </span>
                  <v-spacer></v-spacer>
                  <span class="caption mr-2">Sort list by</span>
                  <v-btn-toggle v-model="sortButtonsWebsites" mandatory color="primary">
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="name" v-on="on">
                          <v-icon color="grey">mdi-alphabetical-variant</v-icon>
                        </v-btn>
                      </template>
                      <span>name</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="favorite" v-on="on">
                          <v-icon color="grey">mdi-heart-outline</v-icon>
                        </v-btn>
                      </template>
                      <span>favorite</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="color" v-on="on">
                          <v-icon color="grey">mdi-palette</v-icon>
                        </v-btn>
                      </template>
                      <span>color</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn small outlined value="date" v-on="on">
                          <v-icon color="grey">mdi-calendar-plus</v-icon>
                        </v-btn>
                      </template>
                      <span>date added</span>
                    </v-tooltip>
                  </v-btn-toggle>
                </v-card-actions>
                <v-autocomplete v-model="websites" :disabled="clearWebsites" clearable
                  :items="websitesAll()" item-text="name" class="hidden-close pt-0 mt-0" 
                  item-value="name" multiple hide-selected hide-details :filter="filterItems"
                  no-data-text="No more websites" :menu-props="{contentClass:'list-with-preview'}"
                >
                  <template v-slot:selection="data">
                    <v-chip v-bind="data.attrs" label close close-icon="mdi-close"
                      @click="data.select" @click:close="removeItem(data.item, 'websites')" 
                      @mouseover.stop="showImage($event, data.item.id, 'website')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                      :input-value="data.selected" outlined :color="data.item.color"
                    > <span>{{ data.item.name }}</span>
                    </v-chip>
                  </template>
                  <template v-slot:item="data">
                    <div class="list-item"
                      @mouseover.stop="showImage($event, data.item.id, 'website')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                        left size="14"> mdi-heart </v-icon>
                      <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                      <span>{{data.item.name}}</span>
                      <span v-if="data.item.altNames.length" class="aliases"> 
                        {{data.item.altNames.join(', ').slice(0,80)}}
                      </span>
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" class="d-flex mt-10">
                <div class="overline edit-path-title">
                  <v-checkbox v-model="pathEditable" hide-details class="mt-0 mr-2"
                  off-icon="mdi-pencil" on-icon="mdi-pencil-off"/>
                </div>
                <v-form ref="form" v-model="valid" style="width: 100%;">
                  <v-text-field 
                    v-model="pathToFile" :rules="[getPathRules]" :disabled="!pathEditable"
                    placeholder="Write file path here" label="File path" class="pt-0 mt-0" />
                </v-form>
              </v-col>
              <v-col cols="12">
                <div class="overline text-center">Bookmark</div>
                <v-textarea clearable auto-grow outlined placeholder="Write bookmark text here" 
                  v-model="$store.state.Bookmarks.bookmarkText" hide-details />
              </v-col>
            </v-row>
          </v-card-text>
        </vuescroll>
      </v-card>
      <div @click="close" class="left-close-panel">
        <div class="content">
          <v-icon color="red" size="15vw">mdi-close</v-icon>
          <span class="red--text">Close</span>
        </div>
      </div>
      <div @click="saveVideoInfo" class="right-close-panel">
        <div class="content">
          <v-icon color="green" size="15vw">mdi-check</v-icon>
          <span class="green--text">Save</span>
        </div>
      </div>
    </v-bottom-sheet>
    
    <v-dialog v-model="calendar" width="300px">
      <v-date-picker @change="setVal($event, calendarId), calendar=false"
        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
        :value="values[calendarId]" no-title color="primary" full-width/>
    </v-dialog>

    <v-btn v-if="sheet" @click="close" fab class="close-btn-float">
      <v-icon large>mdi-close</v-icon>
    </v-btn>

    <v-btn v-if="sheet" @click="saveVideoInfo" fab large class="save-btn">
      <v-icon large>mdi-content-save</v-icon>
    </v-btn>

    <v-dialog v-model="dialogAddNewTag" max-width="400">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">
            Add new tag
          </div>
          <v-spacer></v-spacer>
          <v-icon>mdi-tag-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pb-0">
          <v-form ref="tagform" v-model="validNewTagName" style="width:100%">
            <v-text-field v-model="newTagName" :rules="[getNewTagNameRules]" label="Tag name" outlined dense/>
          </v-form>
        </v-card-actions>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addNewTag" class="ma-4 mt-0" color="green" :disabled="!validNewTagName">
            <v-icon left>mdi-plus</v-icon> Add </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogAddNewPerformer" max-width="400">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">
            Add new performer
          </div>
          <v-spacer></v-spacer>
          <v-icon>mdi-tag-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pb-0">
          <v-form ref="tagform" v-model="validNewPerformerName" style="width:100%">
            <v-text-field v-model="newPerformerName" :rules="[getNewPerformerNameRules]" label="Performer name" outlined dense/>
          </v-form>
        </v-card-actions>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addNewPerformer" class="ma-4 mt-0" color="green" :disabled="!validNewPerformerName">
            <v-icon left>mdi-plus</v-icon> Add </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogAddNewWebsite" max-width="400">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">
            Add new website
          </div>
          <v-spacer></v-spacer>
          <v-icon>mdi-tag-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pb-0">
          <v-form ref="tagform" v-model="validNewWebsiteName" style="width:100%">
            <v-text-field v-model="newWebsiteName" :rules="[getNewWebsiteNameRules]" label="Website name" outlined dense/>
          </v-form>
        </v-card-actions>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addNewWebsite" class="ma-4 mt-0" color="green" :disabled="!validNewWebsiteName">
            <v-icon left>mdi-plus</v-icon> Add </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddNewCard" v-model="dialogAddNewCard" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New {{getMeta(metaIdForNewCard).settings.nameSingular.toLowerCase()}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewCard" ref="formNewCard" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewCard" :rules="[nameRules]" label="Name"/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddNewItem" v-model="dialogAddNewItem" width="700">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New item for meta <b>{{getMeta(metaIdForNewItem).settings.name}}</b></span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewItem" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewItem" ref="formNewItem" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewItem" :rules="[nameRules]" label="Name"/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="dialogListView" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">List view</span>
          <v-spacer></v-spacer>
          <v-btn @click="saveListView" outlined> <v-icon left>mdi-content-save</v-icon> save </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import { ipcRenderer } from 'electron'
import Functions from '@/mixins/Functions'
import MetaGetters from '@/mixins/MetaGetters'
import NameRules from '@/mixins/NameRules'

export default {
  name: "DialogEditPerformer",
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction, Functions, MetaGetters, NameRules],
  mounted () {
    this.$nextTick(function () {
      // get info of video
      if (this.isSelectedSingleVideo) {
        this.sheet = true
        let video = _.cloneDeep(this.video)
        this.performers = video.performers.sort()
        this.tags = video.tags.sort()
        this.websites = video.websites
        this.rating = video.rating
        this.favorite = video.favorite

        // get bookmark text
        if (video) {
          if (video.bookmark) {
            let text = this.$store.getters.bookmarks.get('videos').find({itemId:video.id}).value().text
            this.$store.state.Bookmarks.bookmarkText = text
          }
        }
        this.pathToFile = video.path

        // get date added and date of last edit text
        let dateAdded = new Date(video.date)
        this.added = dateAdded.toLocaleDateString() + ' ' + dateAdded.toLocaleTimeString()
        let dateEdit = new Date(video.edit)
        this.edit = dateEdit.toLocaleDateString() + ' ' + dateEdit.toLocaleTimeString()
        setTimeout(() => {
          this.playPreview()
        }, 300)
      } else this.dialog = true
    })
  },
  beforeDestroy() {
    try {this.$refs.video.src = '' } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) { clearTimeout(this.timeouts[timeout]) }
    clearInterval(this.timeouts.z)
  },
  data: () => ({
    valid: false,
    performers: [],
    tags: [],
    websites: [],
    rating: 0,
    favorite: false,
    clearPerformers: false,
    clearTags: false,
    clearWebsites: false,
    clearRating: false,
    clearFavorite: false,
    pathToFile: '',
    pathEditable: false,
    videoExists: true,
    edit: '',
    added: '',
    timeouts: {},
    muted: true,
    dialog: false,
    sheet: false,
    dialogAddNewTag: false,
    newTagName: '',
    validNewTagName: false,
    dialogAddNewPerformer: false,
    newPerformerName: '',
    validNewPerformerName: false,
    dialogAddNewWebsite: false,
    newWebsiteName: '',
    validNewWebsiteName: false,
    // matched: {
    //   tags: [],
    //   performers: [],
    //   websites: [],
    // }, TODO highlight filtered letters
    // meta
    values: {},
    calendar: false,
    calendarId: null,
    key: Date.now(),
    // add new items 
    dialogAddNewCard: false,
    metaIdForNewCard: null,
    nameForNewCard: '',
    validNewCard: false,
    dialogAddNewItem: false,
    metaIdForNewItem: null,
    nameForNewItem: '',
    validNewItem: false,
    dialogListView: false,
  }),
  computed: {
    isSelectedSingleVideo() { return this.$store.getters.getSelectedVideos.length == 1 },
    video() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      return this.$store.getters.videos.find({id:videoId}).value()
    },
    fileName() { return path.parse(this.video.path).name },
    sortButtonsPerformers: {
      get() { return this.$store.state.Settings.videoEditPerformersSortBy },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'videoEditPerformersSortBy', value}) },
    },
    sortButtonsTags: {
      get() { return this.$store.state.Settings.videoEditTagsSortBy },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'videoEditTagsSortBy', value}) },
    },
    sortButtonsWebsites: {
      get() { return this.$store.state.Settings.videoEditWebsitesSortBy },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'videoEditWebsitesSortBy', value}) },
    },
    darkMode() { return this.$vuetify.theme.isDark },
    gradient() { 
      let color = this.darkMode ? 'rgb(30 30 30)' : 'rgb(255 255 255)'
      return `background: linear-gradient(to top, ${color}, rgba(0,0,0,.0))`
    },
    fileExtension() { return path.parse(this.video.path).ext.replace('.', '').toLowerCase() },
    metaInCard() { return this.$store.state.Settings.videoMetaInCard },
  },
  methods: {
    playPreview() {
      if (!fs.existsSync(this.video.path)) return
      this.$refs.video.src = this.video.path
      if (this.video.duration > 65) {
        this.setVideoProgress(0.1)
        this.timeouts.a = setTimeout(this.setVideoProgress, 5000, 0.2)
        this.timeouts.b = setTimeout(this.setVideoProgress, 10000, 0.3)
        this.timeouts.c = setTimeout(this.setVideoProgress, 15000, 0.4)
        this.timeouts.d = setTimeout(this.setVideoProgress, 20000, 0.5)
        this.timeouts.e = setTimeout(this.setVideoProgress, 25000, 0.6)
        this.timeouts.f = setTimeout(this.setVideoProgress, 30000, 0.7)
        this.timeouts.g = setTimeout(this.setVideoProgress, 35000, 0.8)
        this.timeouts.h = setTimeout(this.setVideoProgress, 40000, 0.9)
        this.timeouts.i = setTimeout(this.setVideoProgress, 45000, 0.95)
        this.timeouts.z = setInterval(() => {
          for (const timeout in this.timeouts) {
            clearTimeout(this.timeouts[timeout])
          }
          this.setVideoProgress(0.1)
          this.timeouts.a = setTimeout(this.setVideoProgress, 5000, 0.2)
          this.timeouts.b = setTimeout(this.setVideoProgress, 10000, 0.3)
          this.timeouts.c = setTimeout(this.setVideoProgress, 15000, 0.4)
          this.timeouts.d = setTimeout(this.setVideoProgress, 20000, 0.5)
          this.timeouts.e = setTimeout(this.setVideoProgress, 25000, 0.6)
          this.timeouts.f = setTimeout(this.setVideoProgress, 30000, 0.7)
          this.timeouts.g = setTimeout(this.setVideoProgress, 35000, 0.8)
          this.timeouts.h = setTimeout(this.setVideoProgress, 40000, 0.9)
          this.timeouts.i = setTimeout(this.setVideoProgress, 45000, 0.95)
        }, 50000)
      }
    },
    setVideoProgress(percent) { this.$refs.video.currentTime = Math.floor(this.video.duration*percent) },
    sortItems(items, type) {
      const sortBy = this[`sortButtons${type}`]
      let itemsSorted = items.orderBy(i=>i.name.toLowerCase(),['asc'])
      if (sortBy !== 'name') {
        if (sortBy == 'color') {
          let swatches = this.$store.state.swatches
          itemsSorted = itemsSorted.orderBy(i=>swatches.indexOf(i.color.toLowerCase()),['asc']).value()
        } else {
          itemsSorted = itemsSorted.orderBy(i=>i[sortBy],['desc']).value()
        }
        return itemsSorted
      } else return itemsSorted.value()
    },
    filterItems(itemF, queryText) {
      let item = _.cloneDeep(itemF)
      let query = queryText.toLowerCase()
      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      let synonym = 'altNames' in item ? 'altNames' : 'aliases'
      let filtersDefault = this.$store.state.Settings.typingFiltersDefault 

      if (filtersDefault) {
        let index = item.name.toLowerCase().indexOf(query)
        if (index > -1) {
          // this.matched.tags.push({
          //   index: index,
          //   text: item.name,
          //   query: query,
          //   type: 'name',
          //   item: item,
          // })
          return true
        } else {
          for (let i=0; i<item[synonym].length; i++) {
            let indexSub = item[synonym][i].toLowerCase().indexOf(query)
            if (indexSub > -1) {
              // this.matched.tags.push({
              //   index: indexSub,
              //   text: item[synonym][i],
              //   query: query,
              //   type: synonym,
              //   item: item,
              // })
              return true
            } 
          }
          return false
        }
      } else {
        if (foundByChars(item.name, query)) return true
        else {
          for (let i=0; i<item[synonym].length; i++) {
            return foundByChars(item[synonym][i], query)
          }
        }
      }
    },
    // highlightText(text, type, typeSub, id) {
    //   let match = _.cloneDeep(_.find(this.matched[type], i=>i.item.id==id))
    //   // console.log(match)
    //   if (!match || match.type !== typeSub) {
    //     if (typeof text == 'string') return text
    //     else return text.join(', ').slice(0,100)
    //   } 
    //   let start = match.index
    //   let end = match.query.length + start
    //   // console.log(this.matched[type][i].query)
    //   if (this.$store.state.Settings.typingFiltersDefault) {
    //     // console.log(text, start, end)
    //     if (match.type == 'name') return transformText(text, start, end)
    //     else {
    //       let synonyms = match.item[match.type]
    //       console.log(synonyms)
    //       let synonymIndex = synonyms.indexOf(match.text)
    //       let textSynonym = synonyms[synonymIndex]
    //       synonyms[synonymIndex] = transformText(textSynonym, start, end)
    //       return synonyms.join(', ').slice(0,100)
    //     } 
    //   }
      
    //   function transformText(text, start, end) {
    //     // console.log(`${text.substring(0, start)}<b>${text.substring(start, end)}</b>${text.substring(end)}`)
    //     return `${text.substring(0, start)}<b>${text.substring(start, end)}</b>${text.substring(end)}`
    //   }
    // },
    close() {
      this.sheet = false
      this.$store.state.Bookmarks.bookmarkText = ''
      setTimeout(() => { this.$store.state.Videos.dialogEditVideoInfo = false }, 300)
    },
    validate () { this.$refs.form.validate() },
    saveVideoInfo() {
        console.log(this.values)
      return
      if (this.isSelectedSingleVideo) {
        this.validate()
        if (this.valid === false) return false
      }
      let videos = this.$store.getters.getSelectedVideos
      videos.map(videoId => {
        let video = _.cloneDeep(this.$store.getters.videos.find({ id: videoId }).value())
        let newPerformers, newTags, newWebsites, newRating, newFavorite, newBookmark, newPath

        if (this.clearPerformers) {
          newPerformers = []
        } else if (!this.isSelectedSingleVideo) {
          newPerformers = _.union(this.performers, video.performers).sort()
        } else if (this.isSelectedSingleVideo) {
          newPerformers = this.performers
        }

        if (this.clearTags) {
          newTags = []
        } else if (!this.isSelectedSingleVideo) {
          newTags = _.union(this.tags, video.tags).sort()
        } else if (this.isSelectedSingleVideo) {
          newTags = this.tags
        }

        if (this.clearWebsite) {
          newWebsites = []
        } else if (!this.isSelectedSingleVideo) {
          newWebsites = _.union(this.websites, video.websites).sort()
        } else if (this.isSelectedSingleVideo) {
          newWebsites = this.websites
        }

        if (this.clearRating) {
          newRating = 0
        } else if (this.rating == 0 && !this.isSelectedSingleVideo) {
          newRating = video.rating
        } else {
          newRating = this.rating
        }
        
        if (this.clearFavorite) {
          newFavorite = false
        } else if (this.favorite == false && !this.isSelectedSingleVideo) {
          newFavorite = video.favorite
        } else {
          newFavorite = this.favorite
        }
        
        if (this.$store.state.Bookmarks.bookmarkText) {
          let bookmark = this.$store.getters.bookmarks.get('videos').find({itemId:videoId})
          newBookmark = true
          if (bookmark.value()) {
            bookmark.assign({ 
              text: this.$store.state.Bookmarks.bookmarkText,
              date: Date.now(),
            }).write()
          } else {
            this.$store.getters.bookmarks.get('videos').push({
              id: shortid.generate(),
              itemId: videoId,
              text: this.$store.state.Bookmarks.bookmarkText,
              date: Date.now(),
            }).write()
          }
        } else {
          this.$store.getters.bookmarks.get('videos').remove({'itemId':videoId}).write()
          newBookmark = false
        }

        if (this.pathToFile && this.pathEditable) {
          newPath = this.pathToFile
          setTimeout(() => {this.$store.state.updateFoldersData = Date.now()}, 1000)
        } else {
          newPath = video.path
        }

        this.$store.getters.videos.find({ id: videoId }).assign({ 
          performers: newPerformers,
          tags: newTags,
          websites: newWebsites,
          rating: newRating,
          favorite: newFavorite,
          bookmark: newBookmark,
          path: newPath,
          edit: Date.now(),
        })
        // .assign(this.values)
        .write()

        console.log(this.values)
        this.$store.commit('updateVideos', [videoId])
        this.$store.dispatch('filterVideos', true)
      })
      // TODO slow close animation
      this.$store.commit('addLog', {type:'info',text:`📹 Video "${this.fileName}" has been edited ✏️`})
      this.$store.state.Videos.dialogEditVideoInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getPathRules(stringPath) {
      if (stringPath.length===0) return 'Path is required'
      else return true
    },
    getImg() {
      let imgPath = path.join(this.$store.getters.getPathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getTag(tagName) { return this.$store.getters.tags.find({name:tagName}).value() },
    removeItem(item, type) { 
      const index = this[type].indexOf(item.name)
      if (index >= 0) this[type].splice(index, 1)
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
    playVideo() {
      const pathToVideo = this.video.path
      if (fs.existsSync(pathToVideo)) {
        this.videoExists = false
        if (this.$store.state.Settings.isPlayVideoInSystemPlayer) shell.openPath(pathToVideo)
        else {
          let data = { videos: [this.video], id: this.video.id, }
          ipcRenderer.send('openPlayer', data)
        }
        setTimeout(() => { this.videoExists = true }, 1500)
      } else this.videoExists = false
    },
    toggleMuted() {
      this.muted = !this.muted
      this.$refs.video.muted = this.muted
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.type.includes('video')))
      return this.sortItems(tags, 'Tags')
    },
    performersAll() {return this.sortItems(this.$store.getters.performers, 'Performers')},
    websitesAll() {return this.sortItems(this.$store.getters.websites, 'Websites')},
    getNewTagNameRules(name) {
      let duplicate = this.$store.getters.tags.find(t=>(t.name.toLowerCase()===name.toLowerCase())).value()
      if (name.length > 100) {
        return 'Name must be less than 100 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined) {
        return 'Tag with that name already exists'
      } else {
        return true
      }
    },
    getNewPerformerNameRules(name) {
      let duplicate = this.$store.getters.performers.find(i=>(i.name.toLowerCase()===name.toLowerCase())).value()
      if (name.length > 100) {
        return 'Name must be less than 100 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined) {
        return 'Performer with that name already exists'
      } else {
        return true
      }
    },
    getNewWebsiteNameRules(name) {
      let duplicate = this.$store.getters.websites.find(i=>(i.name.toLowerCase()===name.toLowerCase())).value()
      if (name.length > 100) {
        return 'Name must be less than 100 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined) {
        return 'Website with that name already exists'
      } else {
        return true
      }
    },
    addNewTag() {
      this.$store.dispatch('addTag', { id: shortid.generate(), name: this.newTagName })
      this.dialogAddNewTag = false
      this.newTagName = ''
      ipcRenderer.send('updatePlayerDb', 'tags') // update tag in player window
    },
    addNewPerformer() {
      this.$store.dispatch('addPerformer', { id: shortid.generate(), name: this.newPerformerName })
      this.dialogAddNewPerformer = false
      this.newPerformerName = ''
      ipcRenderer.send('updatePlayerDb', 'performers') // update performers in player window
    },
    addNewWebsite() {
      this.$store.dispatch('addWebsite', { id: shortid.generate(), name: this.newWebsiteName })
      this.dialogAddNewWebsite = false
      this.newWebsiteName = ''
      ipcRenderer.send('updatePlayerDb', 'websites') // update websites in player window
    },
    setVal(value, metaId) { this.values[metaId] = value },
    removeItemMeta(item, id) { 
      const index = this.values[id].indexOf(item)
      if (index > -1) this.values[id].splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    openDialogAddNewCard(metaId) {
      this.dialogAddNewCard = true
      this.metaIdForNewCard = metaId
    },
    addNewCard() {
      this.$refs.formNewCard.validate()
      if (!this.validNewCard) return
      this.$store.dispatch('addMetaCard', { 
        id: shortid.generate(),
        metaId: this.metaIdForNewCard,
        meta: { name: this.nameForNewCard },
      })
      this.dialogAddNewCard = false
      this.nameForNewCard = ''
    },
    openDialogAddNewItem(metaId) {
      this.dialogAddNewItem = true
      this.metaIdForNewItem = metaId
    },
    addNewItem() {
      this.$refs.formNewItem.validate()
      if (!this.validNewItem) return
      this.$store.getters.meta.find({id:this.metaIdForNewItem}).get('settings.items')
        .push({ id:shortid.generate(), name: this.nameForNewItem }).write()
      this.key = Date.now()
      this.dialogAddNewItem = false
      this.nameForNewItem = ''
    },
    saveListView() {
    },
  },
  watch: {
    clearRating(newValue) { if (newValue) this.rating = 0 },
    rating(newValue) { if (newValue>0) this.clearRating = false },
  },
}
</script>


<style lang="less">
.video-sheet {
  padding-bottom: 20px;
  .v-sheet.v-card {
    border-radius: 10px 10px 0 0;
  }
  .close-btn {
    top: 10px;
    right: 10px;
    position: absolute;
    z-index: 3;
  }
  .video-container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    position: absolute;
    img {
      width: 100%;
      position: absolute;
      z-index: 0;
      opacity: 1;
      filter: blur(10px);
    }
    video {
      min-width: 100%;
      min-height: 100%;
      object-fit: contain;
      z-index: 1;
    }
  }
  .video-title {
    word-break: break-word;
    position: absolute;
    bottom: 80px;
    z-index: 3;
    margin: 0 20px;
  }
  .gradient {
    position: absolute;
    height: 100%;
    width: 100%;
    bottom: 0;
    z-index: 1;
  }
  .actions {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    z-index: 1;
    .v-rating {
      display: inline-flex;
      .v-icon {
        padding: 0;
      }
    }
  }
  .file-info-icon {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 3;
    &:hover + .file-info {
      opacity: 1;
    }
  }
  .file-info {
    opacity: 0;
    transition: .3s all;
    position: absolute;
    left: 50px;
    top: 10px;
    padding: 10px;
    z-index: 2;
  }
  &.v-bottom-sheet.v-dialog.v-bottom-sheet--inset {
    max-width: 55% !important;
    min-width: 600px;
  }
  &.v-dialog:not(.v-dialog--fullscreen) {
    max-height: calc(100% - 60px) !important;
  }
}
.rating-favorite {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit-path-title {
  display: flex;
  justify-content: center;
}
</style> 